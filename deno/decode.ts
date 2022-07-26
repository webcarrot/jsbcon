import {
  decode as agnosticDecode,
  defaultDecompress as agnosticDecompress,
  defaultToUint8Array,
  DefaultBufferTypes,
  Decompress,
  Compression,
} from "./agnostic/mod.ts";

async function dGZ(data: Uint8Array) {
  return new Uint8Array(
    await new Response(
      new Blob([data]).stream().pipeThrough(new DecompressionStream("gzip"))
    ).arrayBuffer()
  );
}

export const defaultDecompress: Decompress = function (compression, data) {
  if (compression === Compression.GZ) return dGZ(data);
  return agnosticDecompress(compression, data);
};

export function decode<T>(
  data: DefaultBufferTypes,
  decompress: Decompress = defaultDecompress
) {
  return agnosticDecode<T>(defaultToUint8Array(data), decompress);
}
