export function bufferToUint8Array(data: Buffer) {
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}
