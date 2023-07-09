import type { NextRequest } from "next/server.js";
import { handleNextRequest } from "../../../../src/app-route";
import express from "express";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((req, res) => {
  res.json(req.body || {});
});

export async function POST(req: NextRequest) {
  return handleNextRequest(req, app);
}
