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
  internalRedirectMethods: []
};

/**
 * Is item in array
 *   @param    {String/array/number/object}   item
 *   @param    {Array}                        array
 *   @return   {Boolean}
 *   @api      private
 */
function isInArray(item, array) {
    for(var i = 0; i < array.length; i++) {
      if(array[i] === item) { return true; }
    }
    return false;
}

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
  for (var option in defaults) {
      settings[option] = (undefined !== options[option]) ? options[option] : defaults[option];
  }

  return settings;
}

function portToUrlString(options) {
  return (options.skipDefaultPort && options.port === 443) ? '' : ':' + options.port;
}

/**
 * Check if method is allowed in settings
 *   @param    {String}    method
 *   @param    {Hash}      options
 *   @return   {Boolean}
 */
function isAllowed(method, settings) {
  return isInArray(method, settings.redirectMethods) || isInArray(method, settings.internalRedirectMethods);
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
 *   @return   {Function}
 *   @api      public
 */

module.exports = function enforceHTTPS(options) {
  options = applyOptions(options);

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

    // Check if method should be Forbidden
    if (!isAllowed(ctx.method, options)) {
      ctx.response.status = 403;
      return;
    }

    // build redirect url
    const httpsHost = options.hostname || url.parse('http://' + ctx.request.header.host).hostname;
    var redirectTo = 'https://' + httpsHost + portToUrlString(options);

    if(!options.ignoreUrl) {
      redirectTo += ctx.request.url;
    }

    // Check if should internal or permanently redirect
    if (isInArray(ctx.method, options.internalRedirectMethods)) {
      ctx.response.status = 307;
    } else if (!options.temporary) {
      ctx.response.status = 301;
    }

    // redirect to secure
    ctx.response.redirect(redirectTo);
  };
};
