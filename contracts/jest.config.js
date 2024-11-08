/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testMatch: ["<rootDir>/test/**/*.test.{js,jsx,ts,tsx}"],
  testEnvironment: "node",
}