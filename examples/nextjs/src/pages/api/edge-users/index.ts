import { createEdgeRouter } from "next-connect";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { User } from "../../../utils/common";
import { validateUser } from "../../../utils/common";
import { getUsers, randomId, saveUsers } from "../../../utils/edge-api";

export const config = {
  runtime: "experimental-edge",
};

const router = createEdgeRouter<NextRequest, NextFetchEvent>();

router.get((req) => {
  const users = getUsers(req);
  return new Response(JSON.stringify({ users }), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });
});

router.post(async (req) => {
  const users = getUsers(req);
  const body = await req.json();
  const newUser = {
    id: randomId(),
    ...body,
  } as User;
  validateUser(newUser);
  users.push(newUser);
  const res = new NextResponse(
    JSON.stringify({
      message: "User has been created",
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }
  );
  saveUsers(res, users);
  return res;
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
