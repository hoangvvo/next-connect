import { createEdgeRouter } from "next-connect";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getUsers } from "../../../utils/edge-api";

export const config = {
  runtime: "edge",
};

const router = createEdgeRouter<NextRequest, NextFetchEvent>();

router.get((req) => {
  const id = req.nextUrl.searchParams.get("id");
  const users = getUsers(req);
  const user = users.find((user) => user.id === id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ user });
});

// this will run if none of the above matches
export default router.handler({
  onError(err) {
    return new NextResponse(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
    });
  },
});
