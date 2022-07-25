import dts from "rollup-plugin-dts";

const config = [
  {
    input: "./src/agnostic/mod.ts",
    output: [{ file: "dist/agnostic.d.ts", format: "es" }],
    plugins: [dts()],
  },
  {
    input: "./src/node/mod.ts",
    output: [{ file: "dist/node.d.ts", format: "es" }],
    plugins: [dts()],
  },
];

export default config;
