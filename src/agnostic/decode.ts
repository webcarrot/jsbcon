import { Compression, Mode } from "./const";

export type Decompress = (
  method: Compression,
  data: Uint8Array
) => Promise<Uint8Array> | Uint8Array;

async function jsonMode(
  compression: Compression,
  data: Uint8Array,
  decompress?: Decompress
) {
  switch (compression) {
    case Compression.OFF:
      break;
    default:
      if (!decompress)
        throw new Error(`Unsupported compression ${compression}`);
      data = await decompress(compression, data);
  }
  return JSON.parse(new TextDecoder().decode(data));
}

async function jsonBinMode(
  compression: Compression,
  data: Uint8Array,
  decompress?: Decompress
) {
  const str = new Array<string>(16);
  for (let i = 0; i < 16; i++) str[i] = data[i].toString(36);
  const uuid = str.join("");
  const chunks: Array<Uint8Array> = [];
  let offset = 16;
  while (offset < data.byteLength) {
    const lengthAb = data.slice(offset, offset + 4);
    const length = new Uint32Array(
      lengthAb.buffer,
      lengthAb.byteOffset,
      lengthAb.byteLength
    )[0];
    offset += 4;
    chunks.push(data.slice(offset, offset + length));
    offset += length;
  }
  const bin = new Map<String, ArrayBuffer>();
  for (let i = 1; i < chunks.length; i++) {
    bin.set(uuid + i.toString(36), chunks[i]);
  }
  let jsonBuffer = chunks[0];
  switch (compression) {
    case Compression.OFF:
      break;
    default:
      if (!decompress)
        throw new Error(`Unsupported compression ${compression}`);
      jsonBuffer = await decompress(compression, jsonBuffer);
  }
  return JSON.parse(new TextDecoder().decode(data), function (_, value) {
    if (typeof value !== "string" || !bin.has(value)) return value;
    return bin.get(value);
  });
}

export async function decode<T>(
  data: Uint8Array,
  decompress?: Decompress
): Promise<
  | [Mode.NULL, null]
  | [Mode.BIN, Uint8Array]
  | [Mode.JSON, T]
  | [Mode.JSON_BIN, T]
> {
  const mode = data[0] as Mode;
  switch (mode) {
    case Mode.NULL:
      return [Mode.NULL, null];
    case Mode.BIN:
      return [Mode.BIN, data.slice(1)];
    case Mode.JSON:
      return [
        Mode.JSON,
        (await jsonMode(data[1], data.slice(2), decompress)) as T,
      ];
    case Mode.JSON_BIN:
      return [
        Mode.JSON_BIN,
        (await jsonBinMode(data[1], data.slice(2), decompress)) as T,
      ];
    default:
      throw new TypeError(`Unsupported mode ${mode}`);
  }
}
