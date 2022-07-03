import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { getUsers } from "../../../common/api";

const router = createRouter<NextApiRequest, NextApiResponse>();

router.get((req, res) => {
  const users = getUsers(req);
  const user = users.find((user) => user.id === req.query.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    user,
  });
});

// this will run if none of the above matches
router.all((req, res) => {
  res.status(405).json({
    error: "Method not allowed",
  });
});

export default router.handler({
  onError(err, req, res) {
    res.status(400).json({
      error: (err as Error).message,
    });
  },
});
