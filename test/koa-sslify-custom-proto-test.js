const Koa = require('koa');
const agent = require('supertest-koa-agent');
const sslify = require('../index.js')
const enforce = sslify.default;

const customProtoHeader = 'x-forwarded-proto-custom';

describe('Custom proxy SSL flag', () => {

  describe('Flag is not set', () => {
    const app = new Koa();

    app.use(enforce());

    app.use((ctx) => {
      ctx.response.status = 200;
    });

    const subject = agent(app);

    it(`should ignore ${customProtoHeader} if not activated`, done => {
      subject
        .get('/ssl')
        .set(customProtoHeader, 'https')
        .expect(301)
        .expect('location', new RegExp('^https://[\\S]*/ssl$'), done);
    });

  });

  describe('Flag is set', () => {
    const app = new Koa();

    app.use(enforce({ resolver: sslify.customProtoHeaderResolver(customProtoHeader) }));

    app.use((ctx) => {
      ctx.response.status = 200;
    });

    var subject = agent(app);

    it('should accept request if flag set and activated', done => {
      subject
        .get('/ssl')
        .set(customProtoHeader, 'https')
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
        .set(`${customProtoHeader}s`, 'https')
        .expect(301)
        .expect('location', new RegExp('^https://[\\S]*/ssl$'), done);
    });
  });
});
