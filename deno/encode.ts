import {
  encode as agnosticEncode,
  IsBuffer,
  ToUint8Array,
  DefaultBufferTypes,
  Compress,
  Compression,
  Data,
} from "./agnostic/mod.ts";

const compressGZ: Compress = async function (data: Uint8Array) {
  if (data.byteLength < 64) return [Compression.OFF, data];
  const compressedStream = new Blob([data])
    .stream()
    .pipeThrough(new CompressionStream("gzip"));
  return [
    Compression.GZ,
    new Uint8Array(await new Response(compressedStream).arrayBuffer()),
  ];
};

function getCompress(
  compression: Compression | undefined
): Compress | undefined {
  switch (compression) {
    case Compression.GZ:
      return compressGZ;
    default:
      return;
  }
}

function makeUUID() {
  return crypto.randomUUID();
}

export async function encode<B extends DefaultBufferTypes>(
  data: Data,
  compression?: Compression | Compress,
  isBuffer?: IsBuffer<B>,
  toUint8Array?: ToUint8Array<B>
) {
  let compress: Compress | undefined;
  if (compression instanceof Function) compress = compression;
  else compress = getCompress(compression);
  return await agnosticEncode<B>(
    data,
    compress,
    isBuffer,
    toUint8Array,
    makeUUID
  );
}
