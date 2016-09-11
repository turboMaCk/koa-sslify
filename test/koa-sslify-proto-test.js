var Koa = require('koa');
var agent = require('supertest-koa-agent');
var enforce = require('../index.js');

describe('Heroku-style proxy SSL flag', () => {

  describe('Flag is not set', () => {
    var app = new Koa();

    app.use(enforce());

    app.use((ctx) => {
      ctx.response.status = 200;
    });

    var subject = agent(app);

    it('should ignore x-forwarded-proto if not activated', done => {
      subject
        .get('/ssl')
        .set('x-forwarded-proto', 'https')
        .expect(301)
        .expect('location', new RegExp('^https://[\\S]*/ssl$'), done);
    });

  });

  describe('Flag is set', () => {
    var app = new Koa();

    app.use(enforce({ trustProtoHeader: true }));

    app.use((ctx) => {
      ctx.response.status = 200;
    });

    var subject = agent(app);

    it('should accept request if flag set and activated', done => {
      subject
        .get('/ssl')
        .set('x-forwarded-proto', 'https')
        .expect(200, 'OK', done);
    });

    it('should redirect if activated but flag not set', done => {
      subject
        .get('/ssl')
        .expect(301)
        .expect('location', new RegExp('^https://[\\S]*/ssl$'), done);
    });

    it('should redirect if activated but wrong flag set', done => {
      subject
        .get('/ssl')
        .set('x-arr-ssl', 'https')
        .expect(301)
        .expect('location', new RegExp('^https://[\\S]*/ssl$'), done);
    });
  });
});
