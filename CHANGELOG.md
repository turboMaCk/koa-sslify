# Changelog

## 2.2.0
- Support for `customProtoHeader`

## 2.1.2
- Remove pre-release flag

## 2.1.1
- Koa 2.0.0 stable - documentation changes

## 2.1.0
- `specCompiantDisallow` support

## v2.0.0
- Koa 2.0.0 (async/await)

## v1.1.0
- Skip `403` port in URL by default
  - new option `skipDefaultPort` to disable this beaviour
  - *CREDITS: [@MathRobin](https://github.com/MathRobin)*

## v1.0.1
- Avoid install warnings with latest node versions

## v1.0.0
- Add method based handling when redirecting
  - whitelist methods for `301/302` redirect (defaults: `GET`, `HEAD`)
  - whitelist methods for `307` redirect (defaults: none)
  - respond with `403` to all other methods

## v0.1.2
- fix `hostname` option
- more tests

## v0.1.1
- Do not use global settings
- add tests

## v0.1.0
- **BREAKING**: options to hash

## v0.0.3
- Support for Azure
- Support for pure HTTPS

# 0.0.1 && 0.0.2 only proto header supported!
