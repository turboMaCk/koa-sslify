var url = require('url');

/**
 * Default configuration
 */
const defaults = {
  trustProtoHeader: false,
  trustAzureHeader: false,
  port: 443,
  hostname: null,
  skipDefaultPort: true,
  ignoreUrl: false,
  temporary: false,
  redirectMethods: ['GET', 'HEAD'],
  internalRedirectMethods: [],
  specCompliantDisallow: false
};

/**
 * Apply options
 *
 *   @param    {Hash}    options
 *   @return   {Hash}
 *   @api      private
 */
function applyOptions(options) {
  const settings = {};
  options = options || {};
  Object.assign(settings, defaults, options);

  return settings;
}

function portToUrlString(options) {
  return (options.skipDefaultPort && options.port === 443) ? '' : ':' + options.port;
}

/**
 * enforceHTTPS
 *
 *   @param    {Hash}       options
 *   @param    {Boolean}    options[trustProtoHeader]
 *   @param    {Boolean}    options[trustAzureHeader]
 *   @param    {Integer}    options[port]
 *   @param    {String}     options[hostname]
 *   @param    {Boolean}    options[ignoreUrl]
 *   @param    {Boolean}    options[temporary]
 *   @param    {Array}      options[redirectMethods]
 *   @param    {Array}      options[internalRedirectMethods]
 *   @param    {Boolean}    options[specCompliantDisallow]
 *   @return   {Function}
 *   @api      public
 */

module.exports = function enforceHTTPS(options) {
  options = applyOptions(options);

  const redirectStatus = {};
  options.redirectMethods.forEach(function (x) {
    redirectStatus[x] = options.temporary ? 302 : 301;
  });
  options.internalRedirectMethods.forEach(function (x) {
    redirectStatus[x] = 307;
  });
  redirectStatus.OPTIONS = 0;

  return (ctx, next) => {

    // First, check if directly requested via https
    var secure = ctx.secure;

    // Second, if the request headers can be trusted (e.g. because they are send
    // by a proxy), check if x-forward-proto is set to https
    if (!secure && options.trustProtoHeader) {
      secure = ctx.request.header['x-forwarded-proto'] === 'https';
    }

    // Third, if trustAzureHeader is set, check for Azure's headers
    // indicating a SSL connection
    if (!secure && options.trustAzureHeader && ctx.request.header["x-arr-ssl"]) {
      secure = true;
    }

    if (secure) {
      return next();
    }

    // Check if method should be disallowed (and handle OPTIONS method)
    if (!redirectStatus[ctx.method]) {
      if (ctx.method === 'OPTIONS') {
        ctx.response.status = 200;
      } else {
        ctx.response.status = options.specCompliantDisallow ? 405 : 403;
      }
      ctx.response.set('Allow', Object.keys(redirectStatus).join());
      ctx.response.body = '';
      return;
    }

    // build redirect url
    const httpsHost = options.hostname || url.parse('http://' + ctx.request.header.host).hostname;
    var redirectTo = 'https://' + httpsHost + portToUrlString(options);

    if(!options.ignoreUrl) {
      redirectTo += ctx.request.url;
    }

    // redirect to secure
    ctx.response.status = redirectStatus[ctx.method];
    ctx.response.redirect(redirectTo);
  };
};
