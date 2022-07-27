import {
  encode as agnosticEncode,
  defaultIsBuffer as agnosticIsBuffer,
  defaultToUint8Array as agnosticToToUint8Array,
  ToUint8Array,
  DefaultBufferTypes as AgnosticBufferTypes,
  Compress,
  Compression,
  Data,
} from "./agnostic/mod.ts";
import { blobToUint8Array } from "./utils.ts";

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

export type DefaultBufferTypes = AgnosticBufferTypes | Blob;

export function defaultIsBuffer<D extends Data>(
  data: D
): D extends DefaultBufferTypes ? true : false {
  return (data instanceof Blob ||
    agnosticIsBuffer(data)) as D extends DefaultBufferTypes ? true : false;
}

export function defaultToUint8Array(data: DefaultBufferTypes) {
  if (data instanceof Blob) return blobToUint8Array(data);
  return agnosticToToUint8Array(data);
}

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
  return await agnosticEncode(
    data,
    makeUUID,
    compress,
    isBuffer ?? defaultIsBuffer,
    toUint8Array ?? defaultToUint8Array
  );
}

export { encode };
