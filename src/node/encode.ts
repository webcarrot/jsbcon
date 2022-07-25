import { gzip, brotliCompress, constants as zlibConstants } from "node:zlib";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import {
  encode as agnosticEncode,
  defaultIsBuffer as agnosticIsBuffer,
  defaultToUint8Array as agnosticToToUint8Array,
  IsBuffer,
  ToUint8Array,
  DefaultBufferTypes as AgnosticBufferTypes,
  Compress,
} from "../agnostic/mod.ts";
import { Compression } from "../agnostic/const";

const cGZ = promisify(gzip);
const cBR = promisify(brotliCompress);
let cLZ4: (data: Buffer) => Promise<Buffer>;
let cSNAPPY: (data: Buffer) => Promise<Buffer>;

const compressGZ: Compress = async function (data) {
  return [
    Compression.GZ,
    defaultToUint8Array(
      await cGZ(data, {
        level: zlibConstants.Z_BEST_SPEED,
      })
    ),
  ];
};

const compressBR: Compress = async function (data) {
  return [
    Compression.BR,
    defaultToUint8Array(
      await cBR(data, {
        params: {
          [zlibConstants.BROTLI_PARAM_MODE]: zlibConstants.BROTLI_MODE_TEXT,
          [zlibConstants.BROTLI_PARAM_QUALITY]:
            zlibConstants.BROTLI_MIN_QUALITY,
          [zlibConstants.BROTLI_PARAM_SIZE_HINT]: data.byteLength,
        },
      })
    ),
  ];
};

const compressLZ4: Compress = async function (data) {
  if (!cLZ4) cLZ4 = (await import("lz4-napi")).compress;
  return [
    Compression.LZ4,
    defaultToUint8Array(
      await cLZ4(Buffer.from(data, data.byteOffset, data.byteLength))
    ),
  ];
};

const compressSNAPPY: Compress = async function (data) {
  if (!cSNAPPY) cSNAPPY = (await import("snappy")).compress;
  return [
    Compression.SNAPPY,
    defaultToUint8Array(
      await cSNAPPY(Buffer.from(data, data.byteOffset, data.byteLength))
    ),
  ];
};

function getCompress(
  compression: Compression | undefined
): Compress | undefined {
  if (!compression) return;
  switch (compression) {
    case Compression.OFF:
      return;
    case Compression.GZ:
      return compressGZ;
    case Compression.BR:
      return compressBR;
    case Compression.LZ4:
      return compressLZ4;
    case Compression.SNAPPY:
      return compressSNAPPY;
    default:
      throw new Error(`Unsupported compression ${compression}`);
  }
}

export type DefaultBufferTypes = AgnosticBufferTypes | Buffer;

export const defaultIsBuffer: IsBuffer<DefaultBufferTypes> = function (data) {
  return data instanceof Buffer || agnosticIsBuffer(data);
};

export const defaultToUint8Array: ToUint8Array<DefaultBufferTypes> = function (
  data
) {
  if (data instanceof Buffer)
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  return agnosticToToUint8Array(data);
};

export async function encode<B extends DefaultBufferTypes>(
  data: any,
  compression?: Compression | Compress,
  isBuffer: IsBuffer<B> = defaultIsBuffer as IsBuffer<any> as IsBuffer<B>,
  toUint8Array: ToUint8Array<B> = defaultToUint8Array as ToUint8Array<any> as ToUint8Array<B>
) {
  let compress: Compress | undefined;
  if (compression instanceof Function) compress = compression;
  else compress = getCompress(compression);
  return agnosticEncode<B>(data, compress, isBuffer, toUint8Array, randomUUID);
}
