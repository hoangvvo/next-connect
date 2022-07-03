import cookie from "cookie";
import crypto from "crypto";
import type { IncomingMessage, ServerResponse } from "http";

const COOKIE_NAME = "nc_users";

export interface User {
  id: string;
  name: string;
  age: number;
}

export const randomId = () => crypto.randomBytes(5).toString("hex");

export const getUsers = (req: IncomingMessage): User[] => {
  // we store all data in cookies for demo purposes
  const cookies = cookie.parse(req.headers.cookie || "");
  if (cookies[COOKIE_NAME]) {
    return JSON.parse(cookies[COOKIE_NAME]);
  }
  return [];
};

export const saveUsers = (res: ServerResponse, users: User[]) => {
  const setCookie = cookie.serialize(COOKIE_NAME, JSON.stringify(users), {
    path: "/",
  });
  res.setHeader("Set-Cookie", setCookie);
};

export const validateUser = (user: User) => {
  user.name = user.name.trim();
  if (!user.name) throw new Error("Name cannot be empty");
  if (user.age < 8) {
    throw new Error("Aren't You a Little Young to be a Web Developer?");
  }
};
