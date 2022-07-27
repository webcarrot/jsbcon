export {
  encode as agnosticEncode,
  decode as agnosticDecode,
  defaultIsBuffer as agnosticIsBuffer,
  defaultToUint8Array as agnosticToToUint8Array,
  Compression,
  Mode,
  defaultDecompress as agnosticDecompress,
} from "../agnostic/mod";
export type {
  Compress,
  Decompress,
  DefaultBufferTypes as AgnosticBufferTypes,
  ToUint8Array,
  Data,
} from "../agnostic/mod";
export { encode, defaultIsBuffer, defaultToUint8Array } from "./encode";
export type { DefaultBufferTypes } from "./encode";
export { decode, defaultDecompress } from "./decode";
export { bufferToUint8Array } from "./utils";
