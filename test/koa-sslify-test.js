var expect = require('chai').expect;
var Koa = require('koa');
var agent = require('supertest-koa-agent');
var enforce = require('../index.js');

var app = null;
var subject = null;

beforeEach(function () {
  app = new Koa();

  app.use(function (ctx, next) {
    ctx.response.status = 200;
    return next();
  });

  subject = agent(app);
})

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
      .expect(403, done);
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

describe('HTTPS enforced with specCompliantDisallow', function () {
  it('should redirect non-SSL GET requests to HTTPS', function (done) {
    app.use(enforce({ specCompliantDisallow: true }));

    subject
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https://[\\S]*/ssl$'), done);
  });

  it('should redirect non-SSL HEAD requests to HTTPS', function (done) {
    app.use(enforce({ specCompliantDisallow: true }));

    subject
      .head('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https://[\\S]*/ssl$'), done);
  });

  it('should send error for non-SSL POST requests', function (done) {
    app.use(enforce({ specCompliantDisallow: true }));

    subject
      .post('/non-ssl-post')
      .expect(405, done);
  });
});

describe('hostname', function() {
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

describe('ignore url', function() {
  it('should ignore url', function (done) {
    app.use(enforce({ ignoreUrl: true }));

    agent(app)
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https:[\\S]*$'), done);
  });
});

describe('skip port', function() {
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

describe('temporary', function() {
  it('should be temporary redirected', function (done) {
    app.use(enforce({ temporary: true }));

    agent(app)
      .get('/ssl')
      .expect(302, done);
  });
});

describe('custom redirect Methods', function () {
  it('should redirect GET', function (done) {
    app.use(enforce({ redirectMethods: ['OPTIONS', 'GET'] }));

    subject
      .get('/ssl')
      .expect(301, done);
  });

  // skipped until discussion complete
  it.skip('should redirect OPTIONS', function (done) {
    app.use(enforce({ redirectMethods: ['OPTIONS', 'GET'] }));

    subject
      .options('/ssl')
      .expect(301, done);
  });

  it('should not redirect HEAD', function (done) {
    app.use(enforce({ redirectMethods: ['OPTIONS', 'GET'] }));

    subject
      .head('/ssl')
      .expect(403, done);
  });
});

describe('custom redirect Methods with specCompliantDisallow', function () {
  it('should redirect GET', function (done) {
    app.use(enforce({ redirectMethods: ['OPTIONS', 'GET'], specCompliantDisallow: true }));

    subject
      .get('/ssl')
      .expect(301, done);
  });

  // skipped until discussion complete
  it.skip('should redirect OPTIONS', function (done) {
    app.use(enforce({ redirectMethods: ['OPTIONS', 'GET'], specCompliantDisallow: true }));

    subject
      .options('/ssl')
      .expect(301, done);
  });

  it('should not redirect HEAD', function (done) {
    app.use(enforce({ redirectMethods: ['OPTIONS', 'GET'], specCompliantDisallow: true }));

    subject
      .head('/ssl')
      .expect(405, done);
  });
});

describe('should define internal redirect methods', function() {
  it('should internal redirect POST', function (done) {
    app.use(enforce({ internalRedirectMethods: ['POST', 'PUT'] }));

    subject
    .post('/ssl')
    .expect(307, done);
  });

  it('should internal redirect PUT', function (done) {
    app.use(enforce({ internalRedirectMethods: ['POST', 'PUT'] }));

    subject
    .put('/ssl')
    .expect(307, done);
  });

  it('should not internal redirect DELETE', function (done) {
    app.use(enforce({ internalRedirectMethods: ['POST', 'PUT'] }));

    subject
    .delete('/ssl')
    .expect(403, done);
  });
});


describe('should define internal redirect methods with specCompliantDisallow', function() {
  it('should internal redirect POST', function (done) {
    app.use(enforce({ internalRedirectMethods: ['POST', 'PUT'], specCompliantDisallow: true }));

    subject
    .post('/ssl')
    .expect(307, done);
  });

  it('should internal redirect PUT', function (done) {
    app.use(enforce({ internalRedirectMethods: ['POST', 'PUT'], specCompliantDisallow: true }));

    subject
    .put('/ssl')
    .expect(307, done);
  });

  it('should not internal redirect DELETE', function (done) {
    app.use(enforce({ internalRedirectMethods: ['POST', 'PUT'], specCompliantDisallow: true }));

    subject
    .delete('/ssl')
    .expect(405, done);
  });
});
