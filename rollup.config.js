import copy from "rollup-plugin-copy";

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
  external: ["trouter"],
  plugins: [
    copy({
      targets: [{ src: "src/index.d.ts", dest: "dist" }],
    }),
  ],
};

export default config;
