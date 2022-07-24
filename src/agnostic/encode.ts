import { Compression, Mode } from "./const";

type UUID = {
  readonly str: string;
  readonly arr: Uint8Array;
};

export type IsBuffer<B extends DefaultBufferTypes, D extends any = any> = (
  data: D
) => D extends B ? true : false;

export type ToUint8Array<B extends DefaultBufferTypes> = (
  data: B
) => Uint8Array;

export type Compress = (
  data: Uint8Array
) => Promise<[Compression, Uint8Array]> | [Compression, Uint8Array];

export type DefaultBufferTypes =
  | ArrayBuffer
  | Uint8Array
  | Uint16Array
  | Uint32Array;

function randomUUID(makeUUID: () => string): UUID {
  const uuid = makeUUID().replaceAll("-", "");
  const arr = new Uint8Array(16);
  for (let i = 0; i < 32; i += 2)
    arr[i] = parseInt(uuid.substring(i, i + 2), 16);
  const str = new Array<string>(8);
  for (let i = 0; i < 16; i++) str[i] = arr[i].toString(36);
  return { str: str.join(""), arr };
}

let UUID: UUID;

export const defaultIsBuffer: IsBuffer<DefaultBufferTypes> = (data) =>
  data &&
  typeof data === "object" &&
  (data instanceof Uint8Array ||
    data instanceof Uint16Array ||
    data instanceof Uint32Array ||
    data instanceof ArrayBuffer);

export const defaultToUint8Array: ToUint8Array<DefaultBufferTypes> = (data) => {
  if (data instanceof Uint8Array) return data;
  if (data instanceof Uint16Array)
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  if (data instanceof Uint32Array)
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  throw new TypeError("Invalid data");
};

function uint8ArraysEqual(a: Uint8Array, b: Uint8Array) {
  if (a.byteLength !== b.byteLength) return false;
  return a.every((val, i) => val === b[i]);
}

class BinLink {
  #index: number;
  #getUUID: () => string;
  constructor(index: number, getUUID: () => string) {
    this.#index = index;
    this.#getUUID = getUUID;
  }
  toJSON() {
    return this.#getUUID() + this.#index.toString(36);
  }
}

function reduce(
  data: any,
  invalidate: (data: any) => void,
  append: (data: any) => BinLink | false
): any {
  invalidate(data);
  if (!data || typeof data !== "object") return data;
  const attachment = append(data);
  if (attachment) return attachment;
  if (data instanceof Array)
    return data.map<any>((data) => reduce(data, invalidate, append));
  if (data.toJSON instanceof Function) {
    const json = data.toJSON();
    if (json !== data) return reduce(json, invalidate, append);
  }
  const keys = Object.keys(data);
  if (keys.length)
    return keys.reduce<any>(function (out, key) {
      out[key] = reduce(data[key], invalidate, append);
      return out;
    }, {});
  return data;
}

function nullMode() {
  return new Uint8Array([Mode.NULL]);
}

function binMode(data: Uint8Array) {
  const out = new Uint8Array(1 + data.byteLength);
  out[0] = Mode.BIN;
  out.set(data, 1);
  return out;
}

function jsonMode(compression: Compression, jsonBuffer: Uint8Array) {
  const out = new Uint8Array(2 + jsonBuffer.byteLength);
  out[0] = Mode.JSON;
  out[1] = compression;
  out.set(jsonBuffer, 2);
  return out;
}

function jsonBinMode(
  compression: Compression,
  uuid: Uint8Array,
  bin: ReadonlyArray<Uint8Array>
) {
  const length = bin.reduce((out, b) => out + b.byteLength + 4, 2 + 16);
  const out = new Uint8Array(length);
  let offset = 0;
  out[offset++] = Mode.JSON_BIN;
  out[offset++] = compression;
  out.set(uuid, offset);
  offset += uuid.byteLength;
  for (let i = 0; i < bin.length; i++) {
    const b = bin[i];
    out.set(new Uint32Array([b.byteLength]), offset);
    offset += 4;
    out.set(b, offset);
    offset += b.byteLength;
  }
  return out;
}

export async function encode<B extends DefaultBufferTypes>(
  data: any,
  compress: Compress | undefined,
  isBuffer: IsBuffer<B> = defaultIsBuffer as IsBuffer<any> as IsBuffer<B>,
  toUint8Array: ToUint8Array<B> = defaultToUint8Array as ToUint8Array<any> as ToUint8Array<B>,
  makeUUID: () => string
): Promise<Uint8Array> {
  if (data === null || data === undefined) return nullMode();
  if (isBuffer(data)) return binMode(toUint8Array(data));
  //#region get binary from data
  if (!UUID) UUID = randomUUID(makeUUID);
  let uuid: UUID = UUID;
  const bin: Array<Uint8Array> = [];
  const uuids = new Set<string>([uuid.str]);
  function getUUID() {
    return uuid.str;
  }
  function invalidate(value: any) {
    if (
      typeof value === "string" &&
      value.startsWith(uuid.str) &&
      uuids.has(value)
    ) {
      UUID = uuid = randomUUID(makeUUID);
      uuids.add(uuid.str);
    }
  }
  function append(value: any): BinLink | false {
    if (!isBuffer(value)) return false;
    const attachment = toUint8Array(value);
    let index = bin.findIndex(function (b) {
      return uint8ArraysEqual(attachment, b);
    });
    if (index === -1) index = bin.push(attachment) - 1;
    return new BinLink(index, getUUID);
  }
  let compression = Compression.OFF;
  let jsonBuffer = new TextEncoder().encode(
    JSON.stringify(reduce(data, invalidate, append))
  );
  if (compress) {
    const [comp, buff] = await compress(jsonBuffer);
    compression = comp;
    jsonBuffer = buff;
  }
  //#endregion
  if (!bin.length) return jsonMode(compression, jsonBuffer);
  return jsonBinMode(compression, uuid.arr, [jsonBuffer].concat(bin));
}
