import {
  encode as agnosticEncode,
  IsBuffer,
  ToUint8Array,
  DefaultBufferTypes,
  Compress,
  Compression,
  Data,
} from "../agnostic/mod";

declare class CompressionStream {
  constructor(format: "gzip" | "deflate" | "deflate-raw");
  readonly readable: ReadableStream<Uint8Array>;
  readonly writable: WritableStream<Uint8Array>;
}

let compressGZ: Compress | undefined;

if (typeof CompressionStream !== "undefined") {
  compressGZ = async function (data: Uint8Array) {
    if (data.byteLength < 64) return [Compression.OFF, data];
    return [
      Compression.GZ,
      new Uint8Array(
        await new Response(
          new Blob([data]).stream().pipeThrough(new CompressionStream("gzip"))
        ).arrayBuffer()
      ),
    ];
  };
}

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
