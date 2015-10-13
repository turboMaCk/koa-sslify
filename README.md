# Koa SSLify

This simple [Koa.js](http://koajs.com/) middleware enforces HTTPS connections on any incoming requests.
In case of a non-encrypted HTTP request, koa-sslify automatically redirects to an HTTPS address using a 301 permanent redirect.

koa-sslify also works behind reverse proxies (load balancers) as they are for example used by Heroku and nodejitsu.
In such cases, however, the trustProxy parameter has to be set (see below).

## Install
```
$ npm install koa-sslify
```

## API
`enforceHTTPS(trustProtoHeader, trustAzureHeader, port, hostname, ignoreUrl, temporary);`

* trustProtoHeader - trust `x-forwarded-proto` header from Heroku or nodejitsu (default is false)
* trustAzureHeader - trust Azure's `x-arr-ssl` header (default is false)
* port - HTTPS port (default value: 443)
* hostname - host name for redirect (by default will redirect to same host)
* ignoreURL - ignore request url ­ redirect all request to root (default is false)
* temporary - use "302 Temporary Redirect" (by default will use "301 Permanent Redirect")

## Reverse Proxies (Heroku, nodejitsu and others)

Heroku, nodejitsu and other hosters often use reverse proxies which offer SSL endpoints but then forward unencrypted HTTP traffic to the website. This makes it difficult to detect if the original request was indeed via HTTPS. Luckily, most reverse proxies set the `x-forwarded-proto` header flag with the original request scheme. koa-sslify is ready for such scenarios, but you have to specifically request the evaluation of this flag:

`app.use(enforceHttps(true))`

Please do *not* set this flag if you are not behind a proxy that is setting this flag as such flags can be easily spoofed in a direct client/server connection.

## Azure support

Azure has a slightly different way of signaling encrypted connections. To tell koa-sslify to look out for Azure's x-arr-ssl header do the following:

`app.use(enforceHttps(false, true))`

Please do *not* set this flag if you are not behind an Azure proxy as this flag can easily be spoofed outside of an Azure environment.

## Usage

### Without reverse proxy
```javascript
var koa = require('koa');
var http = require('http');
var https = require('https');
var fs = require('fs');
var enforceHttps = require('koa-sslify');

var app = koa();

// Force HTTPS on all page
app.use(enforceHttps());

// index page
app.use(function * (next) {
  this.body = "hello world from " + this.request.url;
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

### With reverse proxy
```javascript
var koa = require('koa');
var enforceHttps = require('koa-sslify');

var app = koa();

// Force HTTPS on all page
app.use(enforceHttps(true));

// index page
app.use(function * (next) {
  this.body = "hello world from " + this.request.url;
});

app.listen(3000);
```

## License
MIT
