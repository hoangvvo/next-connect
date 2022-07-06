import { createEdgeRouter } from "next-connect";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getUsers } from "../../../utils/edge-api";

export const config = {
  runtime: "experimental-edge",
};

const router = createEdgeRouter<
  NextRequest & { params?: Record<string, string> },
  NextFetchEvent
>();

router.get((req) => {
  const users = getUsers(req);
  const user = users.find((user) => user.id === req.params?.id);
  if (!user) {
    return new NextResponse(JSON.stringify({ error: "User not found" }), {
      status: 404,
      headers: {
        "content-type": "application/json",
      },
    });
  }
  return new NextResponse(JSON.stringify({ user }), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });
});

// this will run if none of the above matches
router.all(() => {
  return new NextResponse(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: {
      "content-type": "application/json",
    },
  });
});

export default router.handler({
  onError(err) {
    return new NextResponse(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: {
        "content-type": "application/json",
      },
    });
  },
});
