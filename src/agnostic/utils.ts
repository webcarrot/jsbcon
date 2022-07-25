export function getUUIDStr(u8: Uint8Array): string {
  const u32 = new Uint32Array(u8.buffer, u8.byteOffset, u8.byteLength / 4);
  const str = new Array(2);
  for (let i = 0; i < 2; i++) str[i] = u32[i].toString(32);
  return str.join("-");
}
