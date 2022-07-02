/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Since we define "type": "module" at each package's package.json
 * commonjs .js files are treated as ESM, causing:
 *    Error [ERR_REQUIRE_ESM]: require() of ES Module not supported
 *
 * We must rename those commonjs .js files
 * to .cjs so they are treated as CJS
 */
import { readdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

const relativePath = process.argv[2];

const distDir = join(process.cwd(), relativePath);

const files = readdirSync(distDir);

for (const file of files) {
  if (file.endsWith(".js")) {
    const originalPath = join(distDir, file);
    const renamedPath = join(
      distDir,
      file.substring(0, file.length - ".js".length) + ".cjs"
    );
    // rewrite .js requires to .cjs
    writeFileSync(
      originalPath,
      readFileSync(originalPath, { encoding: "utf8" })
        .toString()
        .replaceAll(".js", ".cjs")
    );
    // rename .js to .cjs
    renameSync(originalPath, renamedPath);
  }
}
