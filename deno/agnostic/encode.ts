// Copy of "src/agnostic/encode.ts"
import { Compression, Data, Mode } from "./const.ts";
import { getUUIDStr } from "./utils.ts";

type UUID = {
  readonly str: string;
  readonly arr: Uint8Array;
};

export type ToUint8Array<B> = (data: B) => Promise<Uint8Array> | Uint8Array;

export type Compress = (
  data: Uint8Array
) => Promise<[Compression, Uint8Array]> | [Compression, Uint8Array];

export type DefaultBufferTypes =
  | ArrayBuffer
  | Uint8Array
  | Uint16Array
  | Uint32Array;

type IdProvider = {
  toJSON(): string;
};

function randomUUID(makeUUID: () => string): UUID {
  const uuid = makeUUID().replaceAll("-", "");
  const u8 = new Uint8Array(16);
  for (let i = 0; i < 32; i += 2)
    u8[i] = parseInt(uuid.substring(i, i + 2), 16);
  return { str: getUUIDStr(u8), arr: u8 };
}

export function defaultIsBuffer<D extends Data>(
  data: D
): D extends DefaultBufferTypes ? true : false {
  return (data instanceof Uint8Array ||
    data instanceof Uint16Array ||
    data instanceof Uint32Array ||
    data instanceof ArrayBuffer) as D extends DefaultBufferTypes ? true : false;
}

export const defaultToUint8Array: ToUint8Array<DefaultBufferTypes> = (data) => {
  if (data instanceof Uint8Array) return data;
  if (data instanceof Uint16Array)
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  if (data instanceof Uint32Array)
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  throw new TypeError("Invalid data");
};

function uint8ArraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  const byteLength = a.byteLength;
  if (byteLength !== b.byteLength) return false;
  if (a === b) return true;
  if (byteLength < 128) {
    for (let i = 0; i < byteLength; i++) if (a[i] !== b[i]) return false;
    return true;
  }
  const noFit = byteLength % 4;
  let ae = a;
  let be = b;
  if (noFit) {
    ae = a.slice(0, byteLength - noFit);
    be = b.slice(0, byteLength - noFit);
    for (let i = byteLength - noFit; i < byteLength; i++)
      if (a[i] !== b[i]) return false;
  }
  const at = new Uint32Array(ae.buffer, ae.byteOffset, ae.byteLength / 4);
  const bt = new Uint32Array(be.buffer, be.byteOffset, be.byteLength / 4);
  for (let i = 0; i < at.length; i++) if (at[i] !== bt[i]) return false;
  return true;
}

function reduce(data: Data, append: (data: Data) => IdProvider | false): Data {
  if (!data || typeof data !== "object") return data;
  const attachment = append(data);
  if (attachment) return attachment;
  if (data instanceof Array) {
    const out: Data[] = [];
    for (let i = 0; i < data.length; i++) out[i] = reduce(data[i], append);
    return out;
  }
  if ("toJSON" in data && data.toJSON instanceof Function) {
    const json = data.toJSON();
    if (json !== data) return reduce(json, append);
  }
  const keys = Object.keys(data);
  if (keys.length) {
    let out: Record<string, Data> = {};
    for (let k = 0; k < keys.length; k++) {
      const key = keys[k];
      out[key] = reduce(
        (data as { readonly [key in string]: Data })[key],
        append
      );
    }
    return out;
  }
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

async function encode<B>(
  data: Data,
  makeUUID: () => string,
  compress?: Compress | undefined
): Promise<Uint8Array>;
async function encode<B>(
  data: Data,
  makeUUID: () => string,
  compress: Compress | undefined,
  isBuffer: <D extends Data>(data: D) => D extends B ? true : false,
  toUint8Array: ToUint8Array<B>
): Promise<Uint8Array>;
async function encode(
  data: Data,
  makeUUID: () => string,
  compress?: Compress | undefined,
  isBuffer?: any,
  toUint8Array?: any
): Promise<Uint8Array> {
  isBuffer = (isBuffer ?? defaultIsBuffer) as <D extends Data>(
    data: D
  ) => D extends DefaultBufferTypes ? true : false;
  toUint8Array = (toUint8Array ?? defaultToUint8Array) as (
    data: DefaultBufferTypes
  ) => Uint8Array | Promise<Uint8Array>;
  if (data === null || data === undefined) return nullMode();
  if (isBuffer(data as any)) return binMode(await toUint8Array(data as any));
  //#region get binary from data
  const uuid: UUID = randomUUID(makeUUID);
  const attachments = new Map<DefaultBufferTypes, string>();
  function append(value: Data): IdProvider | false {
    if (!isBuffer(value)) return false;
    const v = value as DefaultBufferTypes;
    attachments.set(v, "");
    return {
      toJSON() {
        return attachments.get(v) as string;
      },
    };
  }
  let compression = Compression.OFF;
  const json = reduce(data, append);
  const bin: Array<Uint8Array> = [];
  for (let [attachment] of attachments) {
    const u8 = await toUint8Array(attachment);
    let index = bin.findIndex(function (existing) {
      return uint8ArraysEqual(u8, existing);
    });
    if (index === -1) index = bin.push(u8) - 1;
    attachments.set(attachment, uuid.str + ":" + index.toString(16));
  }
  let jsonBuffer = new TextEncoder().encode(JSON.stringify(json));
  if (compress) {
    const [comp, buff] = await compress(jsonBuffer);
    compression = comp;
    jsonBuffer = buff;
  }
  //#endregion
  if (!bin.length) return jsonMode(compression, jsonBuffer);
  bin.unshift(jsonBuffer);
  return jsonBinMode(compression, uuid.arr, bin);
}

export { encode };
