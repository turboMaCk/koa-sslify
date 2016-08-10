var url = require('url');

/**
 * Default configuration
 */
var defaults = {
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
  var settings = {};
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

  return function * enforceHTTPS (next) {

    // First, check if directly requested via https
    var secure = this.secure;

    // Second, if the request headers can be trusted (e.g. because they are send
    // by a proxy), check if x-forward-proto is set to https
    if (!secure && options.trustProtoHeader) {
      secure = this.request.header['x-forwarded-proto'] === 'https';
    }

    // Third, if trustAzureHeader is set, check for Azure's headers
    // indicating a SSL connection
    if (!secure && options.trustAzureHeader && this.request.header["x-arr-ssl"]) {
      secure = true;
    }

    if (secure) {
      return yield next;
    }

    // Check if method should be Forbidden
    if (!isAllowed(this.method, options)) {
      this.response.status = 403;
      return;
    }

    // build redirect url
    var httpsHost = options.hostname || url.parse('http://' + this.request.header.host).hostname;
    var redirectTo = 'https://' + httpsHost + portToUrlString(options);

    if(!options.ignoreUrl) {
      redirectTo += this.request.url;
    }

    // Check if should internal or permanently redirect
    if (isInArray(this.method, options.internalRedirectMethods)) {
      this.response.status = 307;
    } else if (!options.temporary) {
      this.response.status = 301;
    }

    // redirect to secure
    this.response.redirect(redirectTo);
  };
};
