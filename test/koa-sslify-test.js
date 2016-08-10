var expect = require('chai').expect;
var koa = require('koa');
var agent = require('supertest-koa-agent');
var enforce = require('../index.js');

describe('HTTPS not enforced', function () {

  var app = koa();

  app.use(function * (next) {
    this.response.status = 200;
    yield next;
  });

  var subject =  agent(app);

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

  var app = koa();

  app.use(enforce());

  app.use(function * (next) {
    this.response.status = 200;

    yield next;
  });

  var subject = agent (app);

  it('should redirect non-SSL GET requests to HTTPS', function (done) {
    subject
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https://[\\S]*/ssl$'), done);
  });

  it('should redirect non-SSL HEAD requests to HTTPS', function (done) {
    subject
      .head('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https://[\\S]*/ssl$'), done);
  });

  it('should send error for non-SSL POST requests', function (done) {
    subject
      .post('/non-ssl-post')
      .expect(403, done);
  });
});

describe('Custom port', function () {

  it('should redirect to 443 by default', function (done) {
    var app = koa();
    app.use(enforce());

    agent(app)
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https://[\\S]*/ssl$'), done);
  });

  it('should redirect to specified port', function (done) {
    var app = koa();
    app.use(enforce({ port: 3001 }));

    agent(app)
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https://[\\S]*\:3001/ssl$'), done);
  });
});

describe('hostname', function() {

  it('shold redirect to same host by default', function (done) {
    var app = koa();
    app.use(enforce());

    agent(app)
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https://127.0.0.1[\\S]*/ssl$'), done);
  });

  it('should redirect to specified host', function (done) {
    var app = koa();
    app.use(enforce({ hostname: 'github.com' }));

    agent(app)
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https://github.com[\\S]*/ssl$'), done);
  });
});

describe('ignore url', function() {

  it('should ignore url', function (done) {
    var app = koa();
    app.use(enforce({ ignoreUrl: true }));

    agent(app)
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https:[\\S]*$'), done);
  });
});

describe('skip port', function() {

  it('should skip port by default', function (done) {
    var app = koa();
    app.use(enforce({ skipDefaultPort: true }));

    agent(app)
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https:[\\S]*/ssl$'), done);
  });

  it('should skip port', function (done) {
    var app = koa();
    app.use(enforce({ skipDefaultPort: true }));

    agent(app)
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https:[\\S]*/ssl$'), done);
  });

  it('should not skip port', function (done) {
    var app = koa();
    app.use(enforce({ skipDefaultPort: false }));

    agent(app)
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https:[\\S]*:443/ssl$'), done);
  });
});

describe('temporary', function() {

  it('should be temporary redirected', function (done) {
    var app = koa();
    app.use(enforce({ temporary: true }));

    agent(app)
      .get('/ssl')
      .expect(302, done);
  });
});

describe('custom redirect Methods', function () {

  var app = koa();
  app.use(enforce({ redirectMethods: ['OPTIONS', 'GET'] }));
  var subject = agent(app);

  if('should redirect GET', function (done) {
    subject
      .get('/ssl')
      .expect(302, done);
  });

  if('should redirect OPTIONS', function (done) {
    subject
      .options('/ssl')
      .expect(302, done);
  });

  if('should not redirect HEAD', function (done) {
    subject
      .head('/ssl')
      .expect(403, done);
  });
});

describe('should define internal redirect methods', function() {

  var app = koa();
  app.use(enforce({ internalRedirectMethods: ['POST', 'PUT'] }));
  var subject = agent(app);

  it('should internal redirect POST', function (done) {
    subject
    .post('/ssl')
    .expect(307, done);
  });

  it('should internal redirect PUT', function (done) {
    subject
    .put('/ssl')
    .expect(307, done);
  });

  it('should not internal redirect DELETE', function (done) {
    subject
    .delete('/ssl')
    .expect(403, done);
  });
});

