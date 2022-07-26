export const enum Mode {
  NULL = 1,
  BIN = 2,
  JSON = 3,
  JSON_BIN = 4,
}

export const enum Compression {
  OFF = 1,
  GZ = 2,
  BR = 3,
  LZ4 = 4,
  SNAPPY = 5,
}

export type Data =
  | null
  | undefined
  | boolean
  | string
  | number
  | object
  | ArrayBuffer
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | ReadonlyArray<Data>
  | { readonly [key in string]: Data }
  | { toJSON: () => Data };
