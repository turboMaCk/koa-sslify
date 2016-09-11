var Koa = require('koa');
var agent = require('supertest-koa-agent');
var enforce = require('../index.js');

describe('HTTPS not enforced', () => {

  var app = new Koa();

  app.use((ctx) => {
    ctx.response.status = 200;
  });

  var subject =  agent(app);

  it('should accept non-ssl requests', done => {
    subject
      .get('/non-ssl')
      .expect(200, 'OK', done);
  });

  it('should accept non-ssl HEAD requests', done => {
    subject
      .head('/non-ssl')
      .expect(200, done);
  });

  it('should accept non-ssl POST requests', done => {
    subject
      .post('/non-ssl')
      .expect(200, 'OK', done);
  });
});

describe('HTTPS enforced', () => {

  var app = new Koa();

  app.use(enforce());

  app.use((ctx) => {
    ctx.response.status = 200;
  });

  var subject = agent (app);

  it('should redirect non-SSL GET requests to HTTPS', done => {
    subject
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https://[\\S]*/ssl$'), done);
  });

  it('should redirect non-SSL HEAD requests to HTTPS', done => {
    subject
      .head('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https://[\\S]*/ssl$'), done);
  });

  it('should send error for non-SSL POST requests', done => {
    subject
      .post('/non-ssl-post')
      .expect(403, done);
  });
});

describe('Custom port', () => {

  it('should redirect to 443 by default', done => {
    var app = new Koa();
    app.use(enforce());

    agent(app)
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https://[\\S]*/ssl$'), done);
  });

  it('should redirect to specified port', done => {
    var app = new Koa();
    app.use(enforce({ port: 3001 }));

    agent(app)
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https://[\\S]*\:3001/ssl$'), done);
  });
});

describe('hostname', function() {

  it('shold redirect to same host by default', done => {
    var app = new Koa();
    app.use(enforce());

    agent(app)
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https://127.0.0.1[\\S]*/ssl$'), done);
  });

  it('should redirect to specified host', done => {
    var app = new Koa();
    app.use(enforce({ hostname: 'github.com' }));

    agent(app)
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https://github.com[\\S]*/ssl$'), done);
  });
});

describe('ignore url', () => {

  it('should ignore url', done => {
    var app = new Koa();
    app.use(enforce({ ignoreUrl: true }));

    agent(app)
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https:[\\S]*$'), done);
  });
});

describe('skip port', () => {

  it('should skip port by default', done => {
    var app = new Koa();
    app.use(enforce({ skipDefaultPort: true }));

    agent(app)
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https:[\\S]*/ssl$'), done);
  });

  it('should skip port', done => {
    var app = new Koa();
    app.use(enforce({ skipDefaultPort: true }));

    agent(app)
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https:[\\S]*/ssl$'), done);
  });

  it('should not skip port', done => {
    var app = new Koa();
    app.use(enforce({ skipDefaultPort: false }));

    agent(app)
      .get('/ssl')
      .expect(301)
      .expect('location', new RegExp('^https:[\\S]*:443/ssl$'), done);
  });
});

describe('temporary', () => {

  it('should be temporary redirected', done => {
    var app = new Koa();
    app.use(enforce({ temporary: true }));

    agent(app)
      .get('/ssl')
      .expect(302, done);
  });
});

describe('custom redirect Methods', () => {

  var app = new Koa();
  app.use(enforce({ redirectMethods: ['OPTIONS', 'GET'] }));
  var subject = agent(app);

  if('should redirect GET', done => {
    subject
      .get('/ssl')
      .expect(302, done);
  });

  if('should redirect OPTIONS', done => {
    subject
      .options('/ssl')
      .expect(302, done);
  });

  if('should not redirect HEAD', done => {
    subject
      .head('/ssl')
      .expect(403, done);
  });
});

describe('should define internal redirect methods', () => {

  var app = new Koa();
  app.use(enforce({ internalRedirectMethods: ['POST', 'PUT'] }));
  var subject = agent(app);

  it('should internal redirect POST', done => {
    subject
      .post('/ssl')
      .expect(307, done);
  });

  it('should internal redirect PUT', done => {
    subject
      .put('/ssl')
      .expect(307, done);
  });

  it('should not internal redirect DELETE', done => {
    subject
      .delete('/ssl')
      .expect(403, done);
  });
});
