import {
  decode as agnosticDecode,
  defaultDecompress as agnosticDecompress,
  Decompress,
  Compression,
} from "../agnostic/mod";
import { defaultToUint8Array, DefaultBufferTypes } from "./encode";

let dGZ: undefined | ((data: Uint8Array) => Promise<Uint8Array>);

declare class DecompressionStream {
  constructor(format: "gzip" | "deflate" | "deflate-raw");
  readonly readable: ReadableStream<Uint8Array>;
  readonly writable: WritableStream<Uint8Array>;
}

if (typeof DecompressionStream !== "undefined") {
  dGZ = async function (data: Uint8Array) {
    return new Uint8Array(
      await new Response(
        new Blob([data]).stream().pipeThrough(new DecompressionStream("gzip"))
      ).arrayBuffer()
    );
  };
}

export const defaultDecompress: Decompress = function (compression, data) {
  if (compression === Compression.GZ && dGZ) return dGZ(data);
  return agnosticDecompress(compression, data);
};

export async function decode<T>(
  data: DefaultBufferTypes,
  decompress: Decompress = defaultDecompress
) {
  return agnosticDecode<T>(await defaultToUint8Array(data), decompress);
}
