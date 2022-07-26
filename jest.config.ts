import type { InitialOptionsTsJest } from "ts-jest";

const configuration: InitialOptionsTsJest = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverage: true,
  detectOpenHandles: true,
  collectCoverageFrom: ["src/node/*.ts", "src/agnostic/*.ts"],
  testTimeout: 5 * 1000,
  roots: ["./src"],
  globals: {
    "ts-jest": {
      tsconfig: "./src/node/tsconfig.json",
    },
  },
};

export default configuration;
