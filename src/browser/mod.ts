export {
  encode as agnosticEncode,
  decode as agnosticDecode,
  defaultIsBuffer,
  defaultToUint8Array,
  Compression,
  Mode,
} from "../agnostic/mod";
export type {
  Compress,
  Decompress,
  DefaultBufferTypes,
  IsBuffer,
  ToUint8Array,
  Data,
} from "../agnostic/mod";
export { encode } from "./encode";
export { decode, defaultDecompress } from "./decode";
