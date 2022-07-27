export {
  encode as agnosticEncode,
  decode as agnosticDecode,
  defaultIsBuffer as agnosticIsBuffer,
  defaultToUint8Array as agnosticToUint8Array,
  Compression,
  Mode,
} from "./agnostic/mod.ts";
export type {
  Compress,
  Decompress,
  DefaultBufferTypes as AgnosticBufferTypes,
  ToUint8Array,
  Data,
} from "./agnostic/mod.ts";
export { encode, defaultIsBuffer, defaultToUint8Array } from "./encode.ts";
export type { DefaultBufferTypes } from "./encode.ts";
export { decode, defaultDecompress } from "./decode.ts";
export { blobToUint8Array } from "./utils.ts";
