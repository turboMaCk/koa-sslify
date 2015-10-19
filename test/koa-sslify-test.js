var expect = require('chai').expect;
var koa = require('koa');
var agent = require('supertest-koa-agent');
var enforce = require('../index.js');

describe('HTTPS not enforced', function() {

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

  var subject =  agent(app);

  it('should redirect non-SSL GET requests to HTTPS', function (done) {
    subject
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https://[\\S]*/ssl$'), done);
  });

  //it('should send error for non-SSL POST requests', function (done) {
    //subject
      //.post('/non-ssl-post')
      //.expect(403, done);
  //});
});

