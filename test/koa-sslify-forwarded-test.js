const Koa = require('koa');
const agent = require('supertest-koa-agent');
const sslify = require('../index.js');
const enforce = sslify.default;

describe('Forwarded header', () => {
  const app = new Koa();

  app.use(enforce({ resolver: sslify.forwardedResolver }));

  app.use((ctx) => {
    ctx.response.status = 200;
  });

  const subject = agent(app);

  it('should accept request with full header', done => {
    subject
      .get('/ssl')
      .set('forwarded', 'by=foo; for=baz; host=localhost; proto=https')
      .expect(200, 'OK', done);
  });

  it('should accept request with full header without spaces', done => {
    subject
      .get('/ssl')
      .set('forwarded', 'by=foo;for=baz;host=localhost;proto=https')
      .expect(200, 'OK', done);
  });

  it('should accept request with just proto part of header', done => {
    subject
      .get('/ssl')
      .set('forwarded', 'proto=https')
      .expect(200, 'OK', done);
  });

  it('should redirect if header is not present', done => {
    subject
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https://[\\S]*/ssl$'), done);
  });

  it('should redirect if proto part of header is not present', done => {
    subject
      .get('/ssl')
      .set('forwarded', 'host=https')
      .expect(301)
      .expect('location', new RegExp('^https://[\\S]*/ssl$'), done);
  });
});
