# Changelog

## 1.0.0
- Add method based handling when redirecting
  - whitelist methods for `301/302` redirect (defaults: `GET`, `HEAD`)
  - whitelist methods for `307` redirect (defaults: none)
  - respond with `403` to all other methods

## 0.1.2
- fix `hostname` option
- more tests

## 0.1.1
- Do not use global settings
- add tests

## 0.1.0
- **BREAKING**: options to hash

## 0.0.3
- Support for Azure
- Support for pure HTTPS

# 0.0.1 && 0.0.2 only proto header supported!
