import { Compression, Mode } from "./const";
import { getUUIDStr } from "./utils";

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
  const u8 = new Uint8Array(16);
  for (let i = 0; i < 32; i += 2)
    u8[i] = parseInt(uuid.substring(i, i + 2), 16);
  return { str: getUUIDStr(u8), arr: u8 };
}

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
  const byteLength = a.byteLength;
  if (byteLength !== b.byteLength) return false;
  if (a === b) return true;
  const noFit = byteLength % 4;
  let ae = a;
  let be = b;
  if (noFit) {
    ae = a.slice(0, byteLength - noFit);
    be = b.slice(0, byteLength - noFit);
    for (let i = byteLength - noFit; i < byteLength; i++) {
      if (a[i] !== b[i]) return false;
    }
  }
  const at = new Uint32Array(ae.buffer, ae.byteOffset, ae.byteLength / 4);
  const bt = new Uint32Array(be.buffer, be.byteOffset, be.byteLength / 4);
  for (let i = 0; i < at.length; i++) {
    if (at[i] !== bt[i]) return false;
  }
  return true;
}

function reduce(data: any, append: (data: any) => string | false): any {
  if (!data || typeof data !== "object") return data;
  const attachment = append(data);
  if (attachment) return attachment;
  if (data instanceof Array)
    return data.map<any>((data) => reduce(data, append));
  if (data.toJSON instanceof Function) {
    const json = data.toJSON();
    if (json !== data) return reduce(json, append);
  }
  const keys = Object.keys(data);
  if (keys.length)
    return keys.reduce<any>(function (out, key) {
      out[key] = reduce(data[key], append);
      return out;
    }, {});
  return data;
}

function nullMode() {
  return new Uint8Array([Mode.NULL]);
}

function binMode(data: Uint8Array) {
  const output = new Uint8Array(1 + data.byteLength);
  const dv = new DataView(output.buffer, output.byteOffset, output.byteLength);
  dv.setUint8(0, Mode.BIN);
  output.set(data, 1);
  return output;
}

function jsonMode(compression: Compression, jsonBuffer: Uint8Array) {
  const output = new Uint8Array(2 + jsonBuffer.byteLength);
  const dv = new DataView(output.buffer, output.byteOffset, output.byteLength);
  dv.setUint8(0, Mode.JSON);
  dv.setUint8(1, compression);
  output.set(jsonBuffer, 2);
  return output;
}

function jsonBinMode(
  compression: Compression,
  uuid: Uint8Array,
  bin: ReadonlyArray<Uint8Array>
) {
  const length = bin.reduce((out, b) => out + b.byteLength + 4, 2 + 16);
  const output = new Uint8Array(length);
  const dv = new DataView(output.buffer, output.byteOffset, output.byteLength);
  dv.setUint8(0, Mode.JSON_BIN);
  dv.setUint8(1, compression);
  let offset = 2;
  output.set(uuid, offset);
  offset += uuid.byteLength;
  for (let i = 0; i < bin.length; i++) {
    const b = bin[i];
    dv.setUint32(offset, b.byteLength, false);
    output.set(b, offset + 4);
    offset += b.byteLength + 4;
  }
  return output;
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
  const uuid: UUID = randomUUID(makeUUID);
  const bin: Array<Uint8Array> = [];
  function append(value: any): string | false {
    if (!isBuffer(value)) return false;
    const attachment = toUint8Array(value);
    let index = bin.findIndex(function (b) {
      return uint8ArraysEqual(attachment, b);
    });
    if (index === -1) index = bin.push(attachment) - 1;
    return uuid.str + ":" + index.toString(16);
  }
  let compression = Compression.OFF;
  let jsonBuffer = new TextEncoder().encode(
    JSON.stringify(reduce(data, append))
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
