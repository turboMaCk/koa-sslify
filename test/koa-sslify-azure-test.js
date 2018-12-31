const Koa = require('koa');
const agent = require('supertest-koa-agent');
const sslify = require('../index.js');
const enforce = sslify.default;

describe('Azure-style proxy SSL flag', () => {
  const app = new Koa();

  app.use(enforce({ resolver: sslify.azureResolver }));

  app.use((ctx) => {
    ctx.response.status = 200;
  });

  const subject = agent(app);

  it('should accept request header is present', (done) => {
    subject
      .get('/ssl')
      .set('x-arr-ssl', 'https')
      .expect(200, 'OK', done);
  });

  it('should redirect if header is not present', (done) => {
    subject
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https://[\\S]*/ssl$'), done);
  });
});
