import { unzip, brotliDecompress } from "node:zlib";
import { promisify } from "node:util";
import { uncompress as lz4 } from "lz4-napi";
import { uncompress as snappy } from "snappy";

import { Compression } from "./const";

const gz = promisify(unzip);
const br = promisify(brotliDecompress);

export async function decode<T extends any>(data: Buffer): Promise<T> {
  const headerAndJsonLength = data.readUInt32LE(0);
  const attachmentsInfoLength = data.readUint32LE(4);
  const compression = data.readUint8(8);
  let textBuffer: Buffer = data.slice(9, 9 + headerAndJsonLength);
  switch (compression) {
    case Compression.NONE:
      break;
    case Compression.GZ:
      textBuffer = await gz(textBuffer);
      break;
    case Compression.BR:
      textBuffer = await br(textBuffer);
      break;
    case Compression.LZ4:
      textBuffer = await lz4(textBuffer);
      break;
    case Compression.SNAPPY:
      textBuffer = (await snappy(textBuffer, { asBuffer: true })) as Buffer;
      break;
    default:
      throw new Error("Invalid compression");
  }
  const text = textBuffer.toString("utf-8");
  if (attachmentsInfoLength) {
    let offset = 9 + headerAndJsonLength;
    const uuid = text.substring(0, 36);
    const attachmentsOffsets: ReadonlyArray<number> = JSON.parse(
      text.substring(36, 36 + attachmentsInfoLength)
    );
    const attachments = new Map<string, Buffer>();
    for (let i = 0; i < attachmentsOffsets.length; i++) {
      const length = attachmentsOffsets[i];
      attachments.set(
        uuid + i.toString(36),
        data.slice(offset, offset + length)
      );
      offset += length;
    }
    return JSON.parse(
      text.substring(36 + attachmentsInfoLength),
      (_, value) => {
        if (typeof value !== "string" || !attachments.has(value)) return value;
        return attachments.get(value);
      }
    ) as T;
  }
  return JSON.parse(text) as T;
}
