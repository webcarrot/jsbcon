import { decode, encode } from "../src/mod";

type Data = any;

function makeData(size: number): Data {
  const x = Buffer.alloc(size, size);
  return {
    num: 1,
    str: "string",
    x,
    y: [x, x, x],
    z: Buffer.alloc(size, size + 1),
  };
}

describe("json-bc", () => {
  describe("basic", () => {
    const TESTS = new Array(10).fill(0).map((_, no) => Math.pow(2, no + 1));

    test.each(TESTS)("size %s", async (size) => {
      const orig = makeData(size);
      const encoded = await encode(orig);
      const decoded = await decode<Data>(
        Buffer.from(encoded.toString("base64"), "base64")
      );
      expect(orig).toMatchObject(decoded);
    });
  });
});
