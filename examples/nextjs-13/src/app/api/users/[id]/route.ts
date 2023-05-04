import { getUsers } from "@/utils/api";
import { logRequest } from "@/utils/middleware";
import { createEdgeRouter } from "next-connect";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

interface RequestContext {
  params: {
    id: string;
  };
}

const router = createEdgeRouter<NextRequest, RequestContext>();

router.use(logRequest);

router.get((req, { params: { id } }) => {
  const users = getUsers(req);
  const user = users.find((user) => user.id === id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ user });
});

export async function GET(request: NextRequest, ctx: RequestContext) {
  return router.run(request, ctx);
}
