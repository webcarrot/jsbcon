import { gzip, brotliCompress, constants as zlibConstants } from "node:zlib";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import {
  encode as agnosticEncode,
  defaultIsBuffer as agnosticIsBuffer,
  defaultToUint8Array as agnosticToToUint8Array,
  ToUint8Array,
  DefaultBufferTypes as AgnosticBufferTypes,
  Compress,
  Compression,
  Data,
} from "../agnostic/mod";
import { bufferToUint8Array } from "./utils";

const cGZ = promisify(gzip);
const cBR = promisify(brotliCompress);

const compressGZ: Compress = async function (data) {
  if (data.byteLength < 64) return [Compression.OFF, data];
  return [
    Compression.GZ,
    await defaultToUint8Array(
      await cGZ(data, {
        level: zlibConstants.Z_BEST_SPEED,
      })
    ),
  ];
};

const compressBR: Compress = async function (data) {
  if (data.byteLength < 64) return [Compression.OFF, data];
  return [
    Compression.BR,
    await defaultToUint8Array(
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

function getCompress(
  compression: Compression | undefined
): Compress | undefined {
  switch (compression) {
    case Compression.GZ:
      return compressGZ;
    case Compression.BR:
      return compressBR;
    default:
      return;
  }
}

export type DefaultBufferTypes = AgnosticBufferTypes | Buffer;

export function defaultIsBuffer<D extends Data>(
  data: D
): D extends DefaultBufferTypes ? true : false {
  return (data instanceof Buffer ||
    agnosticIsBuffer(data)) as D extends DefaultBufferTypes ? true : false;
}

export const defaultToUint8Array: ToUint8Array<DefaultBufferTypes> = function (
  data
) {
  if (data instanceof Buffer) return bufferToUint8Array(data);
  return agnosticToToUint8Array(data);
};

async function encode<B>(
  data: Data,
  compression?: Compression | Compress
): Promise<Uint8Array>;
async function encode<B>(
  data: Data,
  compression: Compression | Compress | undefined,
  isBuffer: <D extends Data>(data: D) => D extends B ? true : false,
  toUint8Array: ToUint8Array<B>
): Promise<Uint8Array>;
async function encode(
  data: Data,
  compression?: Compression | Compress | undefined,
  isBuffer?: any,
  toUint8Array?: any
): Promise<Uint8Array> {
  let compress: Compress | undefined;
  if (compression instanceof Function) compress = compression;
  else compress = getCompress(compression);
  return agnosticEncode(data, randomUUID, compress, isBuffer, toUint8Array);
}

export { encode };
