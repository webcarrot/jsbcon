import { randomUUID } from "node:crypto";
import { gzip, brotliCompress, constants as zlibConstants } from "node:zlib";
import { promisify } from "node:util";
import { compress as lz4 } from "lz4-napi";
import { compress as snappy } from "snappy";

import { Compression } from "./const";

const gz = promisify(gzip);
const br = promisify(brotliCompress);

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

export async function encode(
  data: any,
  {
    compression = Compression.NONE,
    compressionLevel = 1,
  }: { compression?: Compression; compressionLevel?: number } = {}
): Promise<Buffer> {
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
  let textBuffer = Buffer.from(
    attachmentsInfo ? uuid + attachmentsInfo + json : json
  );
  switch (compression) {
    case Compression.NONE:
      break;
    case Compression.GZ:
      textBuffer = await gz(textBuffer, { level: compressionLevel });
      break;
    case Compression.BR:
      textBuffer = await br(textBuffer, {
        params: {
          [zlibConstants.BROTLI_PARAM_MODE]: zlibConstants.BROTLI_MODE_TEXT,
          [zlibConstants.BROTLI_PARAM_QUALITY]: compressionLevel,
        },
      });
      break;
    case Compression.LZ4:
      textBuffer = await lz4(textBuffer);
      break;
    case Compression.SNAPPY:
      textBuffer = (await snappy(textBuffer)) as Buffer;
      break;
    default:
      throw new Error("Invalid compression");
  }
  const top = Buffer.alloc(9);
  top.writeUInt32LE(textBuffer.byteLength, 0);
  top.writeUInt32LE(attachmentsInfo.length, 4);
  top.writeInt8(compression, 8);
  return Buffer.concat([Buffer.from(top.buffer), textBuffer, ...attachments]);
}
