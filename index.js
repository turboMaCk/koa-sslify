/*
  This module exposes factory function to construct middleware
  This factory function accepts options has to configure behaviour
  of middleware.

  The most important part is `resolver` which is a function
    `boolean resolver(ctx : Ctx)` -- Java
    `resolver :: Ctx -> Bool`     -- Haskell

  This function is being called with ctx object of request
    - If `true` is returned connection is considered secure
    - If `false` is returned connection is considered not being secured
*/

const url = require('url');

/**
 * Default configuration
 */
const defaults = {
  resolver: httpsResolver,
  hostname: undefined,
  port: 443,
  skipDefaultPort: true,
  ignoreUrl: false,
  temporary: false,
  redirectMethods: ['GET', 'HEAD'],
  disallowStatus: 405
};


// Merge default options with overwrites and returns new object
function applyOptions(options) {
  const settings = {};
  options = options || {};
  Object.assign(settings, defaults, options);

  return settings;
}


// skip 443 ports in urls
function portToUrlString(options) {
  return (options.skipDefaultPort && options.port === 443) ? '' : ':' + options.port;
}


// middleware itself
function redirect(options, ctx) {
  // Check if method should be disallowed
  if (options.redirectMethods.indexOf(ctx.method) === -1) {
    ctx.response.status = options.disallowStatus;
    if (options.disallowStatus === 405) {
      ctx.response.set('Allow', options.redirectMethods.join(', '));
    }
    ctx.response.body = '';
    return;
  }

  // build redirect url
  const httpsHost = options.hostname || url.parse('http://' + ctx.request.header.host).hostname;
  let redirectTo = `https://${httpsHost}${portToUrlString(options)}`;

  if(!options.ignoreUrl) {
    redirectTo += ctx.request.url;
  }

  // redirect to secure
  ctx.response.status = options.temporary ? 307 : 301;
  ctx.response.redirect(redirectTo);
}


/**
 * enforceHTTPS
 *
 *   @param    {Hash}       options
 *   @param    {Function}   options[resolver]
 *   @param    {Integer}    options[port]
 *   @param    {String}     options[hostname]
 *   @param    {Boolean}    options[ignoreUrl]
 *   @param    {Boolean}    options[temporary]
 *   @param    {Array}      options[redirectMethods]
 *   @param    {Integer}    options[disallowStatus]
 *   @return   {Function}
 *   @api      public
 */
function factory(options) {
  options = applyOptions(options);

  return (ctx, next) => {

    // Next if secure
    if (options.resolver(ctx)) {
      return next();
    }
    // Redirect to HTTPS
    else {
      redirect(options, ctx);
    }
  }
};


/*
  Resolvers
*/

// Default HTTPS resolver
// This works when using node.js TLS support
function httpsResolver(ctx) {
  return ctx.secure;
}


// x-forwarded-proto header resolver
// common for heroku gcp (ingress) etc
function xForwardedProtoResolver(ctx) {
  return ctx.request.header['x-forwarded-proto'] === 'https';
}


// Azure resolver
// Azure is using `x-att-ssl` header
function azureResolver(ctx) {
  return Boolean(ctx.request.header["x-arr-ssl"]);
}


// Custom proto header factory
function customProtoHeaderResolver(header) {
  return (ctx) => {
    return ctx.request.header[header] === 'https';
  }
}


// parse Forwarded header
function parseForwarded(value) {
  const forwarded = {}

  value.trim().split(';').forEach((part) => {
    const pair = part.trim().split('=');
    forwarded[pair[0]] = pair[1];
  });

  return forwarded;
}


// Resolver for `Forwarded` header
// see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Forwarded
function forwardedResolver(ctx) {
  const header = ctx.request.header['forwarded'];

  if (!header) {
    return false;
  } else {
    const forwarded = parseForwarded(header);
    return forwarded.proto === 'https';
  }
}


/*
  Exports
*/
module.exports = {
  __esModule: true,
  default: factory,
  httpsResolver,
  xForwardedProtoResolver,
  azureResolver,
  customProtoHeaderResolver,
  forwardedResolver
};
