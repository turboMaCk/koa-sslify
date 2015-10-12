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
    var redirectTo = 'https://';
    redirectTo += hostname || this.request.hostname;

    if(!ignoreUrl) {
      redirectTo += this.request.url;
    }

    if (!temporary) {
      this.response.status = 301;
    }

    this.response.redirect(redirectTo + ':' + httpsPort);
  };
};
