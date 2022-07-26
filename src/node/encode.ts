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
  Compression,
  Data,
} from "../agnostic/mod";

const cGZ = promisify(gzip);
const cBR = promisify(brotliCompress);

const compressGZ: Compress = async function (data) {
  if (data.byteLength < 64) return [Compression.OFF, data];
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
  if (data.byteLength < 64) return [Compression.OFF, data];
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

export const defaultIsBuffer: IsBuffer<DefaultBufferTypes> = <D extends Data>(
  data: D
) =>
  (data instanceof Buffer ||
    agnosticIsBuffer(data)) as D extends DefaultBufferTypes ? true : false;

export const defaultToUint8Array: ToUint8Array<DefaultBufferTypes> = function (
  data
) {
  if (data instanceof Buffer)
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  return agnosticToToUint8Array(data);
};

export async function encode<B extends DefaultBufferTypes>(
  data: Data,
  compression?: Compression | Compress,
  isBuffer: IsBuffer<B> = defaultIsBuffer as unknown as IsBuffer<B>,
  toUint8Array: ToUint8Array<B> = defaultToUint8Array as unknown as ToUint8Array<B>
) {
  let compress: Compress | undefined;
  if (compression instanceof Function) compress = compression;
  else compress = getCompress(compression);
  return agnosticEncode<B>(data, compress, isBuffer, toUint8Array, randomUUID);
}
