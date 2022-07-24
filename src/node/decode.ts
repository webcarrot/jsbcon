import { unzip, brotliDecompress } from "node:zlib";
import { promisify } from "node:util";
import { decode as agnosticDecode, Decompress } from "../agnostic/mod";
import { Compression } from "../agnostic/const";
import { defaultToUint8Array, DefaultBufferTypes } from "./encode";

function bufferToUint8Array(data: Buffer) {
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

const dGZ = promisify(unzip);
const dBR = promisify(brotliDecompress);
let dLZ4: (data: Buffer) => Promise<Buffer>;
let dSNAPPY: (data: Buffer) => Promise<Buffer | string>;

const decompressGZ = async function (data: Uint8Array) {
  return bufferToUint8Array(await dGZ(data));
};

const decompressBR = async function (data: Uint8Array) {
  return bufferToUint8Array(await dBR(data));
};

const decompressLZ4 = async function (data: Uint8Array) {
  if (!dLZ4) dLZ4 = (await import("lz4-napi")).uncompress;
  return bufferToUint8Array(
    await dLZ4(Buffer.from(data, data.byteOffset, data.byteLength))
  );
};

const decompressSNAPPY = async function (data: Uint8Array) {
  if (!dSNAPPY) dSNAPPY = (await import("snappy")).uncompress;
  const output = await dSNAPPY(
    Buffer.from(data, data.byteOffset, data.byteLength)
  );
  return bufferToUint8Array(
    typeof output === "string" ? Buffer.from(output) : output
  );
};

export const defaultDecompress: Decompress = async function (
  compression,
  data
) {
  switch (compression) {
    case Compression.OFF:
      return data;
    case Compression.GZ:
      return decompressGZ(data);
    case Compression.BR:
      return decompressBR(data);
    case Compression.LZ4:
      return decompressLZ4(data);
    case Compression.SNAPPY:
      return decompressSNAPPY(data);
    default:
      throw new Error(`Unsupported compression ${compression}`);
  }
};

export async function decode<T>(
  data: DefaultBufferTypes,
  decompress: Decompress = defaultDecompress
) {
  return agnosticDecode<T>(defaultToUint8Array(data), decompress);
}
