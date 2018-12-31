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
  port: 443,
  hostname: null,
  resolver: httpsResolver,
  skipDefaultPort: true,
  ignoreUrl: false,
  temporary: false,
  redirectMethods: ['GET', 'HEAD'],
  internalRedirectMethods: [],
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
function middleware(redirectStatus, options) {
  return (ctx, next) => {

    // Apply resolver
    if (options.resolver(ctx)) {
      return next();
    }

    // Check if method should be disallowed (and handle OPTIONS method)
    if (!redirectStatus[ctx.method]) {
      if (ctx.method === 'OPTIONS') {
        ctx.response.status = 200;
      } else {
        ctx.response.status = options.disallowStatus;
      }
      ctx.response.set('Allow', Object.keys(redirectStatus).join());
      ctx.response.body = '';
      return;
    }

    // build redirect url
    const httpsHost = options.hostname || url.parse('http://' + ctx.request.header.host).hostname;
    let redirectTo = 'https://' + httpsHost + portToUrlString(options);

    if(!options.ignoreUrl) {
      redirectTo += ctx.request.url;
    }

    // redirect to secure
    ctx.response.status = redirectStatus[ctx.method];
    ctx.response.redirect(redirectTo);
  };
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
 *   @param    {Array}      options[internalRedirectMethods]
 *   @param    {Integer}    options[disallowStatus]
 *   @return   {Function}
 *   @api      public
 */
function factory(options) {
  options = applyOptions(options);

  // @TODO: try to refactor
  const redirectStatus = {};
  options.redirectMethods.forEach(function (x) {
    redirectStatus[x] = options.temporary ? 302 : 301;
  });
  options.internalRedirectMethods.forEach(function (x) {
    redirectStatus[x] = 307;
  });
  redirectStatus.OPTIONS = 0;

  return middleware(redirectStatus, options);
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
function customProtoHeader(header) {
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
  default: factory,
  httpsResolver,
  xForwardedProtoResolver,
  azureResolver,
  customProtoHeader,
  forwardedResolver
};
