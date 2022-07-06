import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { getUsers, randomId, saveUsers } from "../../../utils/api";
import type { User } from "../../../utils/common";
import { validateUser } from "../../../utils/common";

const router = createRouter<NextApiRequest, NextApiResponse>();

router.get((req, res) => {
  const users = getUsers(req);
  res.json({
    users,
  });
});

router.post((req, res) => {
  const users = getUsers(req);
  const newUser = {
    id: randomId(),
    ...req.body,
  } as User;
  validateUser(newUser);
  users.push(newUser);
  saveUsers(res, users);
  res.json({
    message: "User has been created",
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
    res.status(500).json({
      error: (err as Error).message,
    });
  },
});
