import type { NextRequest } from "next/server.js";
import { handleNextRequest } from "../../../../src/app-route";
import express from "express";

const app = express();
app.use(async (req, res, next) => {
  if (req.query.sendFile === "txt")
    res.sendFile("app/end/message.txt", { root: process.cwd() });
  else if (req.query.sendFile === "html")
    res.sendFile("app/end/message.html", { root: process.cwd() });
  else if (req.query.send) res.send("<!DOCTYPE html>send\n");
  else if (req.query.json) res.json({ message: "Hello" });
  else if (req.query.notFound) next();
  else res.end("Hello");
});

export async function GET(req: NextRequest) {
  return handleNextRequest(req, app);
}

export async function POST(req: NextRequest) {
  return handleNextRequest(req, app);
}
