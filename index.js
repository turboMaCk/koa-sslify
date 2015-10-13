var url = require('url');

/**
 * enforceHTTPS
 *
 * @param {Boolean} trustProtoHeader
 * @param {Boolean} trustAzureHeader
 * @param {Integer} port
 * @param {String} hostname
 * @param {Boolean} ignoreUrl
 * @param {Boolean} temporary
 * @return {Function}
 * @api public
 */

module.exports = function enforceHTTPS(trustProtoHeader, trustAzureHeader, port, hostname, ignoreUrl, temporary) {
  return function* enforceHTTPS(next) {

    // First, check if directly requested via https
    var secure = this.secure;

    // Second, if the request headers can be trusted (e.g. because they are send
    // by a proxy), check if x-forward-proto is set to https
    if (!secure && trustProtoHeader) {
      secure = this.request.header['x-forwarded-proto'] === 'https';
    }

    // Third, if trustAzureHeader is set, check for Azure's headers
    // indicating a SSL connection
    if (!secure && trustAzureHeader && this.request.header["x-arr-ssl"]) {
      secure = true;
    }

    if (secure) {
      return yield next;
    }

    // build redirect url
    var httpsPort = port || 443;
    var urlObject = url.parse('http://' + this.request.header.host);
    var httpsHost = hostname || urlObject.hostname;
    var redirectTo = 'https://' + httpsHost + ':' + httpsPort;

    if(!ignoreUrl) {
      redirectTo += this.request.url;
    }

    if (!temporary) {
      this.response.status = 301;
    }

    // redirect to secure
    this.response.redirect(redirectTo);
  };
};
