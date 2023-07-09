import type { NextRequest } from "next/server.js";
import { handleNextRequest } from "../../../../src/app-route";
import express from "express";

const app = express();
app.use((req, res) => {
  res.sendFile("end/message.txt");
});

export async function POST(req: NextRequest) {
  return handleNextRequest(req, app);
}
