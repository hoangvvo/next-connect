import type { NextRequest } from "next/server.js";

export const logRequest = (
  req: NextRequest,
  params: unknown,
  next: () => void
) => {
  console.log(`${req.method} ${req.url}`);
  return next();
};
