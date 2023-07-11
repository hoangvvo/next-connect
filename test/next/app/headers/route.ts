import type { NextRequest } from "next/server.js";
import { handleNextRequest } from "../../../../src/app-route";
import express from "express";

const app = express();
app.use((req, res) => {
  res.appendHeader("example", "one");
  res.appendHeader("Example", "two");
  res.appendHeader("cookie", "one");
  res.appendHeader("Cookie", "two");
  res.appendHeader("set-cookie", "one");
  res.appendHeader("Set-Cookie", "two");
  res.appendHeader("user-agent", "one");
  res.appendHeader("User-Agent", "two");
  res.append("example", "three");
  res.append("Example", "four");
  res.append("cookie", "three");
  res.append("Cookie", "four");
  res.append("set-cookie", "three");
  res.append("Set-Cookie", "four");
  res.append("user-agent", "three");
  res.append("User-Agent", "four");

  res.json(req.headers);
});

export async function GET(req: NextRequest) {
  return handleNextRequest(req, app);
}
