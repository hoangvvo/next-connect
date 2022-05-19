/**
 * @type {import('rollup').RollupOptions}
 */
 const config = {
  input: "src/index.js",
  output: [
    {
      file: "dist/index.js",
      format: "es",
    },
    {
      file: "dist/index.cjs",
      format: "cjs",
      exports: "default",
    },
  ],
  external: ["trouter"]
};

export default config;
