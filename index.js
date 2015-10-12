var url = require('url');

/**
 * Force SSL.
 *
 * @param {Integer} port
 * @param {String} hostname
 * @param {Boolean} temporary
 * @param {Boolean} ignoreUrl
 * @return {Function}
 * @api public
 */

module.exports = function enforceHTTPS(port, hostname, ignoreUrl, temporary) {
  return function* enforceHTTPS(next) {
    var secure = this.request.header['x-forwarded-proto'] === 'https';

    if (secure) {
      return yield next;
    }

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

    this.response.redirect(redirectTo);
  };
};
