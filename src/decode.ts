import { brotliDecompress } from "node:zlib";
import { promisify } from "node:util";

const decompress = promisify(brotliDecompress);

export async function decode<T extends any>(data: Buffer): Promise<T> {
  const headerAndJsonLength = data.readUInt32LE(0);
  const attachmentsInfoLength = data.readUint32LE(4);
  const headerAndJson = (
    await decompress(data.slice(8, 8 + headerAndJsonLength))
  ).toString("utf-8");

  if (attachmentsInfoLength) {
    let offset = 8 + headerAndJsonLength;
    const uuid = headerAndJson.substring(0, 36);
    const attachmentsOffsets: ReadonlyArray<number> = JSON.parse(
      headerAndJson.substring(36, 36 + attachmentsInfoLength)
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
      headerAndJson.substring(36 + attachmentsInfoLength),
      (_, value) => {
        if (typeof value !== "string" || !attachments.has(value)) return value;
        return attachments.get(value);
      }
    ) as T;
  }
  return JSON.parse(headerAndJson) as T;
}
