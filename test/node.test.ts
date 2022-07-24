import {
  decode,
  encode,
  Compression,
  Mode,
  defaultToUint8Array,
} from "../src/node/mod";

describe("json-bc/node", () => {
  const TESTS = new Array(1)
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
      function makeData(size: number): any {
        const x = new Uint8Array(size).fill(size);
        return {
          num: 1,
          str: "string",
          x,
          y: new Array(size).fill(x),
          z: Buffer.alloc(size).fill(size + 1),
        };
      }
      test.each(TESTS)(
        "size: %s compression: %s",
        async (size, compression) => {
          const orig = makeData(size);
          const encoded = await encode(orig, compression);
          const [mode, decoded] = await decode<any>(encoded);
          expect(mode).toEqual(Mode.JSON_BIN);
          expect({ ...orig, z: defaultToUint8Array(orig.z) }).toMatchObject(
            decoded
          );
        }
      );
    });
  });
});
