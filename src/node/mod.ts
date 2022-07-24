export {
  encode as agnosticEncode,
  decode as agnosticDecode,
  defaultIsBuffer as agnosticIsBuffer,
  defaultToUint8Array as agnosticToToUint8Array,
  Compression,
  Mode,
} from "../agnostic/mod";
export type {
  Compress,
  Decompress,
  DefaultBufferTypes as AgnosticBufferTypes,
  IsBuffer,
  ToUint8Array,
} from "../agnostic/mod";
export { encode, defaultIsBuffer, defaultToUint8Array } from "./encode";
export type { DefaultBufferTypes } from "./encode";
export { decode, defaultDecompress } from "./decode";
