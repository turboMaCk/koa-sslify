var expect = require('chai').expect;
var Koa = require('koa');
var agent = require('supertest-koa-agent');
var koaSSLify = require('../index.js');
var enforce = koaSSLify.default;

var app = null;
var subject = null;

beforeEach(function () {
  app = new Koa();

  app.use(function (ctx, next) {
    ctx.response.status = 200;
    return next();
  });

  subject = agent(app);
});

describe('next() should be returned', () => {
  let app, subject;

  app = new Koa();
  app.use(enforce({ resolver: koaSSLify.xForwardedProtoResolver }));
  app.use(async function (ctx, next) {
    body = await new Promise(function (resolve) {
      setTimeout(() => {
        resolve('OK');
      }, 0);
    });

    ctx.response.body = body;
  });

  subject = agent(app);

  it('should enfore https', function (done) {
    subject
      .get('/ssl')
      .expect(301, done);
  });

  it('should return ok', function (done) {
    subject
      .get('/')
      .set('x-forwarded-proto', 'https')
      .expect(200, "OK", done);
  });
});

describe('HTTPS not enforced', function () {
  it('should accept non-ssl requests', function (done) {
    subject
      .get('/non-ssl')
      .expect(200, 'OK', done);
  });

  it('should accept non-ssl HEAD requests', function (done) {
    subject
      .head('/non-ssl')
      .expect(200, done);
  });

  it('should accept non-ssl POST requests', function (done) {
    subject
      .post('/non-ssl')
      .expect(200, 'OK', done);
  });
});

describe('HTTPS enforced', function() {
  it('should redirect non-SSL GET requests to HTTPS', function (done) {
    app.use(enforce());

    subject
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https://[\\S]*/ssl$'), done);
  });

  it('should redirect non-SSL HEAD requests to HTTPS', function (done) {
    app.use(enforce());

    subject
      .head('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https://[\\S]*/ssl$'), done);
  });

  it('should send error for non-SSL POST requests', function (done) {
    app.use(enforce());

    subject
      .post('/non-ssl-post')
      .expect(405, done);
  });
});

describe('Custom port', function () {
  it('should redirect to 443 by default', function (done) {
    app.use(enforce());

    agent(app)
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https://[\\S]*/ssl$'), done);
  });

  it('should redirect to specified port', function (done) {
    app.use(enforce({ port: 3001 }));

    agent(app)
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https://[\\S]*\:3001/ssl$'), done);
  });
});

describe('Hostname', function() {
  it('shold redirect to same host by default', function (done) {
    app.use(enforce());

    agent(app)
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https://127.0.0.1[\\S]*/ssl$'), done);
  });

  it('should redirect to specified host', function (done) {
    app.use(enforce({ hostname: 'github.com' }));

    agent(app)
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https://github.com[\\S]*/ssl$'), done);
  });
});

describe('Ignore url', function() {
  it('should ignore url', function (done) {
    app.use(enforce({ ignoreUrl: true }));

    agent(app)
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https:[\\S]*$'), done);
  });
});

describe('Skip port', function() {
  it('should skip port by default', function (done) {
    app.use(enforce());

    agent(app)
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https:[\\S]*/ssl$'), done);
  });

  it('should skip port', function (done) {
    app.use(enforce({ skipDefaultPort: true }));

    agent(app)
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https:[\\S]*/ssl$'), done);
  });

  it('should not skip port', function (done) {
    app.use(enforce({ skipDefaultPort: false }));

    agent(app)
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https:[\\S]*:443/ssl$'), done);
  });
});

describe('Temporary', function() {
  it('should be temporary redirected', function (done) {
    app.use(enforce({ temporary: true }));

    agent(app)
      .get('/ssl')
      .expect(307, done);
  });
});

describe('Custom redirect Methods', function () {
  it('should redirect GET', function (done) {
    app.use(enforce({ redirectMethods: ['OPTIONS', 'GET'] }));

    subject
      .get('/ssl')
      .expect(301, done);
  });

  it('should not redirect HEAD', function (done) {
    app.use(enforce({ redirectMethods: ['OPTIONS', 'GET'] }));

    subject
      .head('/ssl')
      .expect(405, done);
  });
});

describe('Disallow status', function () {
  it('should return 405 by defaul', function (done) {
    app.use(enforce());

    subject
      .post('/ssl')
      .expect('Allow', 'GET, HEAD')
      .expect(405, done);
  });

  it('should by possible to set custom status', function (done) {
    app.use(enforce({ disallowStatus: 403 }));

    subject
      .post('/ssl')
      // allow header is not defined
      .expect(function (res) {
        res.body.allow = res.header.allow;
      })
      .expect(403, { allow: undefined }, done);
  });
});
