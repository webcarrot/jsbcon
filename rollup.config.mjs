import dts from "rollup-plugin-dts";

const config = [
  {
    input: "./src/mod.ts",
    output: [{ file: "dist/mod.d.ts", format: "es" }],
    plugins: [dts()],
  },
];

export default config;
