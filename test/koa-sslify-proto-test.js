const Koa = require('koa');
const agent = require('supertest-koa-agent');
const sslify = require('../index.js');
const enforce = sslify.default;

describe('Heroku-style proxy SSL flag', () => {
  const app = new Koa();

  app.use(enforce({ resolver: sslify.xForwardedProtoResolver }));

  app.use((ctx) => {
    ctx.response.status = 200;
  });

  const subject = agent(app);

  it('should accept request if header value is https', done => {
    subject
      .get('/ssl')
      .set('x-forwarded-proto', 'https')
      .expect(200, 'OK', done);
  });

  it('should redirect if header is not present', done => {
    subject
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https://[\\S]*/ssl$'), done);
  });

  it('should redirect if header value is http', done => {
    subject
      .get('/ssl')
      .set('x-forwarded-proto', 'http')
      .expect(301)
      .expect('location', new RegExp('^https://[\\S]*/ssl$'), done);
  });
});
