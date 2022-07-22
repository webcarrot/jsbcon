import { randomUUID } from "node:crypto";
import { brotliCompress } from "node:zlib";
import { promisify } from "node:util";

const compress = promisify(brotliCompress);
let UUID = randomUUID();
const UUID_ERROR = new RangeError("UUID");

function isBin(data: any) {
  return data instanceof Uint8Array || data instanceof ArrayBuffer;
}

function toBuffer(data: any): Buffer {
  if (data instanceof Buffer) return data;
  return Buffer.from(data);
}

function reduce(data: any, attachments: Array<Buffer>, uuid: string): any {
  if (typeof data === "string" && data.startsWith(uuid)) throw UUID_ERROR;
  else if (!data || typeof data !== "object") return data;
  else if (data instanceof Array)
    return data.map<any>((data) => reduce(data, attachments, uuid));
  else if (isBin(data)) {
    const buffer = toBuffer(data);
    let index = attachments.findIndex(
      (b) => b.byteLength === buffer.byteLength && b.equals(buffer)
    );
    if (index === -1) index = attachments.push(buffer) - 1;
    return uuid + index.toString(36);
  } else {
    const keys = Object.keys(data);
    if (keys.length)
      return keys.reduce<any>((out, key) => {
        out[key] = reduce(data[key], attachments, uuid);
        return out;
      }, {});
    return data;
  }
}

export async function encode(data: any): Promise<Buffer> {
  let uuid = UUID;
  let attachments: Array<Buffer>;
  let json: string;
  while (true) {
    try {
      attachments = [];
      json = JSON.stringify(reduce(data, attachments, uuid));
      break;
    } catch (err) {
      if (err !== UUID_ERROR) throw err;
      uuid = UUID = randomUUID();
    }
  }
  const attachmentsInfo = attachments.length
    ? JSON.stringify(attachments.map((b) => b.byteLength))
    : "";
  const headerAndJson = await compress(
    attachmentsInfo ? uuid + attachmentsInfo + json : json
  );
  const top = Buffer.alloc(8);
  top.writeUInt32LE(headerAndJson.byteLength);
  top.writeUInt32LE(attachmentsInfo.length, 4);
  return Buffer.concat([
    Buffer.from(top.buffer),
    headerAndJson,
    ...attachments,
  ]);
}
