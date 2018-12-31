<div align="center">
    <h1>Koa SSLify</h1>
    <a href="https://travis-ci.org/turboMaCk/koa-sslify">
        <img src="https://travis-ci.org/turboMaCk/koa-sslify.svg?branch=master" alt="build">
    </a>
    <a href="https://codeclimate.com/github/turboMaCk/koa-sslify">
      <img src="https://codeclimate.com/github/turboMaCk/koa-sslify/badges/gpa.svg" alt="code climate">
    </a>
    <a href="https://badge.fury.io/js/koa-sslify">
      <img src="https://badge.fury.io/js/koa-sslify.svg" alt="version">
    </a>
    <p>Enforce HTTPS middleware for Koa.js</p>
</div>

![][http://www.vpdm.ca/wp-content/uploads/2017/03/https_3.png]

[Koa.js](http://koajs.com/) middleware to enforce HTTPS connection on any incoming requests.
In case of a non-encrypted HTTP request, koa-sslify automatically redirects to an HTTPS address using a `301 permanent redirect`
(or optionally `302 Temporary Redirect`).

Koa SSLify can also work behind reverse proxies (load balancers) like on Heroku, Azure, GCP Ingress etc
and supports custom implementations of proxy resolvers.

## Install

```
$ npm install --save koa-sslify
```

## Usage

Importing default factory function:

```
const sslify = require('koa-sslify').default;
```

This will import main function that takes several options:

| name                      | type                          | default           | description                                          |
| ------------------------- | ----------------------------- | ----------------- | ---------------------------------------------------- |
| `resolver`                | <function> (ctx : Ctx) : Bool | `httpsResolver`   | Function used to test if request is secure           |
| `hostname`                | String                        | `undefined`       | Hostname for redirect (uses request host if not set) |
| `port`                    | Integer                       | `443`             | Port of HTTPS server                                 |
| `ignoreUrl`               | Boolean                       | `false`           | Ignore url path (redirect to domain))                |
| `temporary`               | Boolean                       | `false`           | Temporary mode (use 302 Temporary Redirect)          |
| `skipDefaultPort`         | Boolean                       | `true`            | Avoid `:403` port in redirect url                    |
| `redirectMethods`         | Array<String>                 | `['GET', 'HEAD']` | Whitelist methods that should be redirected          |
| `internalRedirectMethods` | Array<String>                 | `[]`              | Whitelist methods for `307 Internal Redirect`        |
| `disallowStatus`          | Integer                       | `405`             | Status returned for dissalowed methods               |

### Resolvers

TBA

## Reverse Proxies (Heroku, Nodejitsu, GCE Ingress and others)

Heroku, nodejitsu, GCE Ingress and other hosters often use reverse proxies which offer SSL endpoints but then forward unencrypted HTTP traffic to the website. This makes it difficult to detect if the original request was indeed via HTTPS. Luckily, most reverse proxies set the `x-forwarded-proto` header flag with the original request scheme. koa-sslify is ready for such scenarios, but you have to specifically request the evaluation of this flag:

```javascript
app.use(enforceHttps({
  trustProtoHeader: true
}))
```

Please do *not* set this flag if you are not behind a proxy that is setting this header as such flags can be easily spoofed in a direct client/server connection.

## Azure Support

Azure has a slightly different way of signaling encrypted connections. To tell koa-sslify to look out for Azure's x-arr-ssl header do the following:

```javascript
app.use(enforceHttps({
  trustAzureHeader: true
}))
```

Please do *not* set this flag if you are not behind an Azure proxy as this flag can easily be spoofed outside of an Azure environment.

## Custom reverse-proxy header Support

```javascript
app.use(enforceHttps({
  customProtoHeader: 'x-forwarded-proto-custom'
}))
```

## Usage

### Without Reverse Proxy
```javascript
var Koa = require('koa');
var http = require('http');
var https = require('https');
var fs = require('fs');
var enforceHttps = require('koa-sslify');

var app = new Koa();

// Force HTTPS on all page
app.use(enforceHttps());

// index page
app.use(ctx => {
  ctx.body = "hello world from " + ctx.request.url;
});

// SSL options
var options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt')
}

// start the server
http.createServer(app.callback()).listen(80);
https.createServer(options, app.callback()).listen(443);
```

### With Reverse Proxy
```javascript
var Koa = require('koa');
var enforceHttps = require('koa-sslify');

var app = new Koa();

// Force HTTPS on all page
app.use(enforceHttps({
  trustProtoHeader: true
}));

// index page
app.use((ctx) => {
  ctx = "hello world from " + ctx.request.url;
});

app.listen(3000);
```

## Advanced Redirect Setting

### Redirect Methods
By default only `GET` and `HEAD` methods are whitelisted for redirect.
koa-sslify will respond with `403` (`405` if `specCompliantDisallow` option is set) on all other methods.
You can change whitelisted methods by passing `redirectMethods` array to options.

### Internal Redirect Support \[POST/PUT\]
**By default there is no HTTP(S) methods whitelisted for `307 internal redirect`.**
You can define custom whitelist of methods for `307` by passing `internalRedirectMethods` array to options.
This should be useful if you want to support `POST` and `PUT` delegation from `HTTP` to `HTTPS`.
For more info see [this](http://www.checkupdown.com/status/E307.html) article.

### Skip Default Port in Redirect URL
**By default this plugin exclude port from redirect url if it's set to `443`.**
Since `443` is default port for `HTTPS` browser will use it by default anyway so there
is no need to explicitly return it as part of URL. Anyway in case you need to **always return port as part of URL string**
you can pass options with `skipDefaultPort: false` to do the trick.

*Thanks to [@MathRobin](https://github.com/MathRobin) for implementation of this as well as port skipping itself. Thanks to [@sethb0](https://github.com/sethb0) for specCompliantDisallow feature and implementation.*

## Build locally
```
git clone git@github.com:sethb0/koa-sslify.git
cd koa-sslify
git checkout koa2
npm install
```

### Run tests
```
npm test
```

## License
MIT

## Credits
This project is heavily inspired by [Florian Heinemann's](https://github.com/florianheinemann) [express-sslify](https://github.com/florianheinemann/express-sslify)
and [Vitaly Domnikov's](https://github.com/dotcypress) [koa-force-ssl](https://github.com/dotcypress/koa-force-ssl).
