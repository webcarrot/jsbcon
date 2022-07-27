export async function blobToUint8Array(data: Blob) {
  return new Uint8Array(await data.arrayBuffer());
}
