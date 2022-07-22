import { decode, encode, Compression } from "../src/mod";

type Data = any;

function makeData(size: number): Data {
  const x = Buffer.alloc(size, size);
  return {
    num: 1,
    str: "string",
    x,
    y: new Array(size).fill(x),
    z: Buffer.alloc(size, size + 1),
  };
}

describe("json-bc", () => {
  describe("basic", () => {
    const TESTS = new Array(5)
      .fill(0)
      .map((_, no) => Math.pow(2, no * 2))
      .flatMap((size) =>
        [
          Compression.NONE,
          Compression.GZ,
          Compression.BR,
          Compression.LZ4,
          Compression.SNAPPY,
        ].map((compression): [number, Compression] => [size, compression])
      );

    test.each(TESTS)("size: %s compression: %s", async (size, compression) => {
      const orig = makeData(size);
      const encoded = await encode(orig, { compression });
      const decoded = await decode<Data>(encoded);
      expect(orig).toMatchObject(decoded);
    });
  });
});
