var url = require('url');

/**
 * Default configuration
 */
var defaults = {
  trustProtoHeader: false,
  trustAzureHeader: false,
  port: 443,
  ignoreUrl: false,
  temporary: false
};

/**
 * Apply options
 *
 * @param {Hash} options
 * @return {Hash}
 * @api private
 */
function applyOptions(options) {
   for (var option in options) {
     defaults[option] = options[option];
   }

   return defaults;
}

/**
 * enforceHTTPS
 *
 * @param {Hash} options
 *  @param {Boolean} trustProtoHeader
 *  @param {Boolean} trustAzureHeader
 *  @param {Integer} port
 *  @param {String} hostname
 *  @param {Boolean} ignoreUrl
 *  @param {Boolean} temporary
 *  @return {Function}
 * @api public
 */

module.exports = function enforceHTTPS(options) {
  options = applyOptions(options);

  return function* enforceHTTPS(next) {

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

    // build redirect url
    var httpsHost = options.hostname || url.parse('http://' + this.request.header.host).hostname;
    var redirectTo = 'https://' + httpsHost + ':' + options.port;

    if(!options.ignoreUrl) {
      redirectTo += this.request.url;
    }

    if (!options.temporary) {
      this.response.status = 301;
    }

    // redirect to secure
    this.response.redirect(redirectTo);
  };
};
