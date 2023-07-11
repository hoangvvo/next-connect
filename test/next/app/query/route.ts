import type { NextRequest } from "next/server.js";
import { handleNextRequest } from "../../../../src/app-route";
import express from "express";

const app = express();
app.use((req, res) => {
  res.json(req.query);
});

export async function GET(req: NextRequest) {
  return handleNextRequest(req, app);
}
