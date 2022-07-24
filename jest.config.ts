import type { InitialOptionsTsJest } from "ts-jest";

const configuration: InitialOptionsTsJest = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverage: true,
  detectOpenHandles: true,
  collectCoverageFrom: ["src/**/*.ts"],
  testTimeout: 5 * 1000,
};

export default configuration;
