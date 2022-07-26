import dts from "rollup-plugin-dts";
import typescript from "@rollup/plugin-typescript";

const config = [
  //#region agnostic
  {
    input: "./src/agnostic/mod.ts",
    output: [{ file: "dist/agnostic.d.ts", format: "es" }],
    plugins: [dts()],
  },
  {
    input: "./src/agnostic/mod.ts",
    output: [{ file: "dist/agnostic.mjs", format: "es", sourcemap: true }],
    plugins: [
      typescript({
        include: ["./src/agnostic/*.ts"],
        exclude: ["./src/*/*.test.ts"],
      }),
    ],
  },
  {
    input: "./src/agnostic/mod.ts",
    output: [{ file: "dist/agnostic.cjs", format: "cjs", sourcemap: true }],
    plugins: [
      typescript({
        include: ["./src/agnostic/*.ts"],
        exclude: ["./src/*/*.test.ts"],
      }),
    ],
  },
  //#endregion
  //#region browser
  {
    input: "./src/browser/mod.ts",
    output: [{ file: "dist/browser.d.ts", format: "es" }],
    plugins: [dts()],
  },
  {
    input: "./src/browser/mod.ts",
    output: [{ file: "dist/browser.mjs", format: "es", sourcemap: true }],
    plugins: [
      typescript({
        include: ["./src/browser/*.ts", "./src/agnostic/*.ts"],
        exclude: ["./src/*/*.test.ts"],
      }),
    ],
  },
  {
    input: "./src/browser/mod.ts",
    output: [{ file: "dist/browser.cjs", format: "cjs", sourcemap: true }],
    plugins: [
      typescript({
        include: ["./src/browser/*.ts", "./src/agnostic/*.ts"],
        exclude: ["./src/*/*.test.ts"],
      }),
    ],
  },
  //#endregion
  //#region node
  {
    input: "./src/node/mod.ts",
    output: [{ file: "dist/node.d.ts", format: "es" }],
    plugins: [dts()],
  },
  {
    input: "./src/node/mod.ts",
    output: [{ file: "dist/node.mjs", format: "es", sourcemap: true }],
    plugins: [
      typescript({
        include: ["./src/node/*.ts", "./src/agnostic/*.ts"],
        exclude: ["./src/*/*.test.ts"],
        compilerOptions: {
          types: ["node"],
        },
      }),
    ],
  },
  {
    input: "./src/node/mod.ts",
    output: [{ file: "dist/node.cjs", format: "cjs", sourcemap: true }],
    plugins: [
      typescript({
        include: ["./src/node/*.ts", "./src/agnostic/*.ts"],
        exclude: ["./src/*/*.test.ts"],
        compilerOptions: {
          types: ["node"],
        },
      }),
    ],
  },
  //#endregion
];

export default config;
