![@webcarrot/jsbcon - Simple transport format](https://github.com/webcarrot/jsbcon/raw/main/js-bc-on.png?raw=true&sanitize=true)

# @webcarrot/jsbcon

Simple transport format

**WARNING**: WIP

## Use cases

- "Replace" `multipart/form-data`
- Delivering and receiving rich data in a simple and optimal way
 
## Environments

- [x] nodejs
- [x] browsers
- [x] deno

## Operating modes

1. [x] `null`
2. [x] binary
3. [x] `JSON` _(optional compression)_
4. [x] `JSON` _(optional compression)_ + binary

## TODO / WIP

- [ ] RFC / Specification
- [ ] Documentation
- [ ] `Accept`/`Content-Type` header helpers - mime negotiation
- [ ] Optional decode output binary transformations (from `Uint8Array` to `Buffer` / `Blob` / `Whatever`)
- [ ] Add more compression methods
- [ ] Add operating modes to produce and receive streams of:
    - [ ] binary
    - [ ] `JSON` _(optional compression)_
    - [ ] `JSON` _(optional compression)_ + binary
- [ ] Plugins/helpers for clients: `fetch`, `axios`, `deno` etc.
- [ ] Plugins/helpers for servers: `express`, `koa`, `deno` etc.
- [ ] CI
- [ ] nodejs (`http` / `express` / `koa`) + browsers (`playwright`) integration tests
- [ ] deno + browsers (`playwright`) integration tests

## Examples

### Node

### Browsers

### Deno