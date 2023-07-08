import express from "express";
import { test } from "tap";
import { handleNextRequest } from "../src/app-route.js";

test("simple", async (t) => {
  const request = new Request("http://example/foo/bar");
  const app = express();
  app.get("/foo/:hello", (req, res) => {
    console.log("handle inner");
    res.json({ message: req.params.hello });
  });

  try {
    console.log("handle outer");
    const response = await handleNextRequest(request, app);
    t.same(response.body, { message: "bar" }, "returns the body");
  } catch (error) {
    console.log("error", error.message);
  }
});
