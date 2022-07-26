import { equal } from "https://deno.land/std/testing/asserts.ts";
import { decode, encode, Compression, Mode } from "./mod.ts";

const TESTS = [
  {
    name: "number",
    data: (size: number) => size,
    mode: Mode.JSON,
  },
  {
    name: "string",
    data: (size: number) => `${size}/`.repeat(size),
    mode: Mode.JSON,
  },
  {
    name: "null",
    data: (_: number) => null,
    mode: Mode.NULL,
  },
  {
    name: "bin",
    data: (size: number) =>
      new Uint8Array((1 + Math.random() * size) | 0).fill(size % 256),
    mode: Mode.BIN,
  },
  {
    name: "bin",
    data: (size: number) => {
      const a = new Uint8Array((1 + Math.random() * size) | 0).fill(size % 256);
      const b = new Uint8Array([1, 2, 3, 4, 5]);
      const c = new Uint8Array([1, 2, 3, 4, 4]);
      const d = new Uint8Array([1, 3, 3, 4, 5]);
      const bb = new Uint8Array([1, 2, 3, 4]);
      const cc = new Uint8Array([1, 2, 3, 4]);
      const dd = new Uint8Array([1, 3, 3, 4]);

      return {
        string: "hi",
        null: null,
        num: 2343434.23,
        obj: {
          b,
          bb,
        },
        a,
        aa: [a, a, a],
        b,
        c,
        d,
        bb,
        cc,
        dd,
      };
    },
    mode: Mode.JSON_BIN,
  },
].flatMap(({ name, data, mode }) =>
  new Array(5)
    .fill(0)
    .map((_, no) => Math.pow(2, (no + 4) * 2))
    .flatMap((size) =>
      [undefined, Compression.OFF, Compression.GZ].map(
        (
          compression
        ): [
          string,
          (size: number) => any,
          number,
          Mode,
          undefined | Compression
        ] => [name, data, size, mode, compression]
      )
    )
);

TESTS.forEach(([name, makeData, size, iMode, compression]) => {
  Deno.test(`${name} ${size} ${compression}`, async () => {
    const iData = makeData(size);
    const eData = await encode(iData, compression);
    const [oMode, oData] = await decode(eData);
    equal(iMode, oMode);
    equal(iData, oData);
  });
});
