import {
  decode,
  encode,
  Compression,
  Mode,
  defaultToUint8Array,
} from "../src/node/mod";

describe("json-bc/node", () => {
  const TESTS = new Array(5)
    .fill(0)
    .map((_, no) => Math.pow(2, (no + 2) * 2))
    .flatMap((size) =>
      [
        undefined,
        Compression.OFF,
        Compression.GZ,
        Compression.BR,
        Compression.LZ4,
        Compression.SNAPPY,
      ].map((compression): [number, undefined | Compression] => [
        size,
        compression,
      ])
    );
  describe("pure json", () => {
    describe("number", () => {
      function makeData(size: number): any {
        return size;
      }
      test.each(TESTS)(
        "size: %s compression: %s",
        async (size, compression) => {
          const orig = makeData(size);
          const encoded = await encode(orig, compression);
          const [mode, decoded] = await decode(encoded);
          expect(mode).toEqual(Mode.JSON);
          expect(orig).toEqual(decoded);
        }
      );
    });
    describe("string", () => {
      function makeData(size: number): any {
        return size.toString();
      }
      test.each(TESTS)(
        "size: %s compression: %s",
        async (size, compression) => {
          const orig = makeData(size);
          const encoded = await encode(orig, compression);
          const [mode, decoded] = await decode(encoded);
          expect(mode).toEqual(Mode.JSON);
          expect(orig).toEqual(decoded);
        }
      );
    });
    describe("null", () => {
      function makeData(): any {
        return null;
      }
      test.each(TESTS)("size: %s compression: %s", async (_, compression) => {
        const orig = makeData();
        const encoded = await encode(orig, compression);
        const [mode, decoded] = await decode(encoded);
        expect(mode).toEqual(Mode.NULL);
        expect(orig).toEqual(decoded);
      });
    });
    describe("object", () => {
      function makeData(size: number): any {
        return { size: new Array(size).fill({ size }) };
      }
      test.each(TESTS)(
        "size: %s compression: %s",
        async (size, compression) => {
          const orig = makeData(size);
          const encoded = await encode(orig, compression);
          const [mode, decoded] = await decode<any>(encoded);
          expect(mode).toEqual(Mode.JSON);
          expect(orig).toMatchObject(decoded);
        }
      );
    });
  });

  describe("attachments", () => {
    describe("attachment standalone", () => {
      function makeData(size: number) {
        return Buffer.alloc(size, size);
      }
      test.each(TESTS)(
        "size: %s compression: %s",
        async (size, compression) => {
          const orig = makeData(size);
          const encoded = await encode(orig, compression);
          const [mode, decoded] = await decode<any>(encoded);
          expect(mode).toEqual(Mode.BIN);
          expect(defaultToUint8Array(orig)).toMatchObject(decoded);
        }
      );
    });
    describe("attachments in object", () => {
      function makeData(size: number) {
        const u8 = new Uint8Array(1).fill(255);
        const u16 = new Uint16Array(3).fill(65535);
        const u32 = new Uint32Array(1).fill(4294967295);
        const u8h = new Uint8Array(1).fill(254 / 2);
        const u16h = new Uint16Array(3).fill(65534 / 2);
        const u32h = new Uint32Array(1).fill(4294967294 / 2);
        return {
          num: 1,
          str: "string",
          u8,
          u16,
          u32,
          u8h,
          u16h,
          u32h,
          u8a: [u8],
          u16a: [u16],
          u32a: [u32],
          z: {
            toJSON() {
              return Buffer.alloc(2).fill(size + 1);
            },
          },
        };
      }
      test.each(TESTS)(
        "size: %s compression: %s",
        async (size, compression) => {
          const orig = makeData(size);
          const encoded = await encode(orig, compression);
          const [mode, decoded] = await decode<any>(encoded);
          expect(mode).toEqual(Mode.JSON_BIN);
          expect({
            ...orig,
            u8: defaultToUint8Array(orig.u8),
            u16: defaultToUint8Array(orig.u16),
            u32: defaultToUint8Array(orig.u32),
            u8h: defaultToUint8Array(orig.u8h),
            u16h: defaultToUint8Array(orig.u16h),
            u32h: defaultToUint8Array(orig.u32h),
            u8a: [defaultToUint8Array(orig.u8a[0])],
            u16a: [defaultToUint8Array(orig.u16a[0])],
            u32a: [defaultToUint8Array(orig.u32a[0])],
            z: defaultToUint8Array(orig.z.toJSON()),
          }).toMatchObject(decoded);
          expect(
            new DataView(
              decoded.u8.buffer,
              decoded.u8.byteOffset,
              decoded.u8.byteLength
            ).getUint8(0)
          ).toEqual(255);
          expect(
            new DataView(
              decoded.u16.buffer,
              decoded.u16.byteOffset,
              decoded.u16.byteLength
            ).getUint16(0, true)
          ).toEqual(65535);
          expect(
            new DataView(
              decoded.u32.buffer,
              decoded.u32.byteOffset,
              decoded.u32.byteLength
            ).getUint32(0, true)
          ).toEqual(4294967295);

          expect(
            new DataView(
              decoded.u8h.buffer,
              decoded.u8h.byteOffset,
              decoded.u8h.byteLength
            ).getUint8(0)
          ).toEqual(254 / 2);
          expect(
            new DataView(
              decoded.u16h.buffer,
              decoded.u16h.byteOffset,
              decoded.u16h.byteLength
            ).getUint16(0, true)
          ).toEqual(65534 / 2);
          expect(
            new DataView(
              decoded.u32h.buffer,
              decoded.u32h.byteOffset,
              decoded.u32h.byteLength
            ).getUint32(0, true)
          ).toEqual(4294967294 / 2);
        }
      );
    });
  });
});
