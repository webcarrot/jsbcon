import { gunzip } from "https://deno.land/x/compress@v0.4.4/gzip/gzip.ts";
import {
  decode as agnosticDecode,
  defaultToUint8Array,
  DefaultBufferTypes,
  Decompress,
  Compression,
} from "../agnostic/mod.ts";

export const defaultDecompress: Decompress = function (compression, data) {
  switch (compression) {
    case Compression.OFF:
      return data;
    case Compression.GZ:
      return gunzip(data);
    default:
      throw new Error(`Unsupported compression ${compression}`);
  }
};

export function decode<T>(
  data: DefaultBufferTypes,
  decompress: Decompress = defaultDecompress
) {
  return agnosticDecode<T>(defaultToUint8Array(data), decompress);
}
