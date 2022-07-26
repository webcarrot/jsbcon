![@webcarrot/jsbcon - Simple transport format](https://github.com/webcarrot/jsonbc/raw/main/js-bc-on.png?raw=true)

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

## Working modes

1. [x] `null`
2. [x] binary
3. [x] `JSON` + _(optional)_ compression
4. [x] `JSON` + _(optional)_ compression + binary

## TODO / WIP

- [ ] RFC / Specification
- [ ] Documentation
- [ ] `Accept`/`Content-Type` header helpers - mime negotiation
- [ ] Optional output binary transformations (from `Uint8Array` to `Buffer` / `Blob` / `Whatever`)
- [ ] Add more compression methods
- [ ] Add working mode for streaming `JSON` + _(optional)_ compression + binary 
- [ ] Plugins/helpers for clients: `fetch`, `axios`, `deno` etc.
- [ ] Plugins/helpers for servers: `express`, `koa`, `deno` etc.
- [ ] CI
- [ ] nodejs (`http` / `express` / `koa`) + browsers (`playwright`) integration tests
- [ ] deno + browsers (`playwright`) integration tests

## Examples

### Node

### Browsers

### Deno