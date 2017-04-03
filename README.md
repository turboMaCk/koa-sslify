# Koa SSLify
[![Build Status](https://travis-ci.org/turboMaCk/koa-sslify.svg?branch=master)](https://travis-ci.org/turboMaCk/koa-sslify)
[![Code Climate](https://codeclimate.com/github/turboMaCk/koa-sslify/badges/gpa.svg)](https://codeclimate.com/github/turboMaCk/koa-sslify)
[![npm version](https://badge.fury.io/js/koa-sslify.svg)](https://badge.fury.io/js/koa-sslify)

This simple [Koa.js](http://koajs.com/) middleware enforces HTTPS connections on any incoming requests.
In case of a non-encrypted HTTP request, koa-sslify automatically redirects to an HTTPS address using a `301 permanent redirect`.

koa-sslify also works behind reverse proxies (load balancers) as they are for example used by Heroku and nodejitsu.
In such cases, however, the `trustProxy` parameter has to be set (see below).

## Install
```
$ npm install koa-sslify
```

## API

### `enforceHttps(options);`
**params:** {Hash} options

**return:** {Function}

### Available Options
*   `trustProtoHeader [Boolean]` - trust `x-forwarded-proto` header from Heroku or nodejitsu (default is `false`)
*   `trustAzureHeader [Boolean]` - trust Azure's `x-arr-ssl` header (default is `false`)
*   `port [Integer]` - HTTPS port (default is `443`)
*   `hostname [String]` - host name for redirect (default is to redirect to same host)
*   `ignoreUrl [Boolean]` - ignore request url, redirect all requests to root (default is `false`)
*   `temporary [Boolean]` - use `302 Temporary Redirect` (default is to use `301 Permanent Redirect`)
*   `skipDefaultPort [Boolean]` - Skip port in redirect URL if it's `443` (default is `true`)
*   `redirectMethods [Array]` - Whitelist methods that should be redirected (default is `['GET', 'HEAD']`)
*   `internalRedirectMethods [Array]` - Whitelist methods for `307 Internal Redirect` (default is `[]`)
*   `specCompliantDisallow [Boolean]` - use status of `405` for disallowed methods (default is to use `403`)

## Reverse Proxies (Heroku, Nodejitsu and others)

Heroku, nodejitsu and other hosters often use reverse proxies which offer SSL endpoints but then forward unencrypted HTTP traffic to the website. This makes it difficult to detect if the original request was indeed via HTTPS. Luckily, most reverse proxies set the `x-forwarded-proto` header flag with the original request scheme. koa-sslify is ready for such scenarios, but you have to specifically request the evaluation of this flag:

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

With [love, internet style](https://www.youtube.com/watch?v=Xe1TZaElTAs).
