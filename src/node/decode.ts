import { unzip, brotliDecompress } from "node:zlib";
import { promisify } from "node:util";
import {
  decode as agnosticDecode,
  Decompress,
  defaultDecompress as agnosticDecompress,
} from "../agnostic/mod";
import { Compression } from "../agnostic/const";
import { defaultToUint8Array, DefaultBufferTypes } from "./encode";
import { bufferToUint8Array } from "./utils";

const dGZ = promisify(unzip);
const dBR = promisify(brotliDecompress);

export const defaultDecompress: Decompress = async function (
  compression,
  data
) {
  switch (compression) {
    case Compression.GZ:
      return bufferToUint8Array(await dGZ(data));
    case Compression.BR:
      return bufferToUint8Array(await dBR(data));
  }
  return agnosticDecompress(compression, data);
};

export async function decode<T>(
  data: DefaultBufferTypes,
  decompress: Decompress = defaultDecompress
) {
  return agnosticDecode<T>(await defaultToUint8Array(data), decompress);
}
