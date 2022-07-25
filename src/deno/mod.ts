export {
  encode as agnosticEncode,
  decode as agnosticDecode,
  defaultIsBuffer,
  defaultToUint8Array,
  Compression,
  Mode,
} from "../agnostic/mod.ts";
export type {
  Compress,
  Decompress,
  DefaultBufferTypes,
  IsBuffer,
  ToUint8Array,
} from "../agnostic/mod.ts";
export { encode } from "./encode.ts";
export { decode, defaultDecompress } from "./decode.ts";
