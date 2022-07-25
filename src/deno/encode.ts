import { gzip } from "https://deno.land/x/compress@v0.4.4/gzip/gzip.ts";
import {
  encode as agnosticEncode,
  IsBuffer,
  ToUint8Array,
  DefaultBufferTypes,
  Compress,
  Compression,
} from "../agnostic/mod.ts";

const compressGZ: Compress = function (data) {
  return [
    Compression.GZ,
    gzip(data, {
      level: 1,
    }),
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
    default:
      throw new Error(`Unsupported compression ${compression}`);
  }
}

export async function encode<B extends DefaultBufferTypes>(
  data: any,
  compression?: Compression | Compress,
  isBuffer?: IsBuffer<B>,
  toUint8Array?: ToUint8Array<B>
) {
  let compress: Compress | undefined;
  if (compression instanceof Function) compress = compression;
  else compress = getCompress(compression);
  return await agnosticEncode<B>(data, compress, isBuffer, toUint8Array, () =>
    crypto.randomUUID()
  );
}
