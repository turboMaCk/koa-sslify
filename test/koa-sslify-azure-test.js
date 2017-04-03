var Koa = require('koa');
var agent = require('supertest-koa-agent');
var enforce = require('../index.js');

describe('Azure-style proxy SSL flag', () => {

  describe('flag is not set', () => {
    var app = new Koa();

    app.use(enforce());

    app.use((ctx) => {
      ctx.response.status = 200;
    });

    var subject = agent(app);

    it('should ignore x-arr-ssl if not activated', (done) => {
      subject
        .get('/ssl')
        .set('x-arr-ssl', 'https')
        .expect(301)
        .expect('location', new RegExp('^https://[\\S]*/ssl$'), done);
    });
  });

  describe('flag is set', () => {
    var app = new Koa();

    app.use(enforce({ trustAzureHeader: true }));

    app.use((ctx) => {
      ctx.response.status = 200;
    });

    var subject = agent(app);

    it('should accept request if flag set and activated', (done) => {
      subject
        .get('/ssl')
        .set('x-arr-ssl', 'https')
        .expect(200, 'OK', done);
    });

    it('should redirect if activated but flag not set', (done) => {
      subject
        .get('/ssl')
        .expect(301)
        .expect('location', new RegExp('^https://[\\S]*/ssl$'), done);
    });

    it('should redirect if activated but wrong flag set', (done) => {
      subject
        .get('/ssl')
        .set('x-forwarded-proto', 'https')
        .expect(301)
        .expect('location', new RegExp('^https://[\\S]*/ssl$'), done);
    });
  });
});
