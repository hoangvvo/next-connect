import { test } from "tap";
import { createRouter } from "../src/index.js";

test("imports", async (t) => {
  t.ok(createRouter);
});
