import type { IncomingMessage, ServerResponse } from "http";
import { test } from "tap";
import { expressWrapper } from "../src/express.js";
import { NodeRouter } from "../src/node.js";

test("expressWrapper", async (t) => {
  const req = { url: "/" } as IncomingMessage;
  const res = {} as ServerResponse;

  t.test("basic", async (t) => {
    t.plan(3);
    const ctx = new NodeRouter();
    const midd = (reqq, ress, next) => {
      t.same(reqq, req, "called with req");
      t.same(ress, res, "called with res");
      next();
    };
    ctx.use(expressWrapper(midd)).use(() => "ok");
    t.same(await ctx.run(req, res), "ok", "returned the last value");
  });

  t.test("next()", async (t) => {
    t.plan(2);
    const ctx = new NodeRouter();
    const midd = (reqq, ress, next) => {
      next();
    };
    ctx.use(expressWrapper(midd)).use(async () => "ok");
    t.same(await ctx.run(req, res), "ok", "returned the last value");

    const ctx2 = new NodeRouter();
    const err = new Error("💥");
    ctx2.use(expressWrapper(midd)).use(async () => {
      throw err;
    });
    t.rejects(() => ctx2.run(req, res), err, "throws async error");
  });

  t.test("next(err)", async (t) => {
    const err = new Error("💥");
    const ctx = new NodeRouter();
    const midd = (reqq, ress, next) => {
      next(err);
    };
    ctx.use(expressWrapper(midd)).use(async () => "ok");
    t.rejects(
      () => ctx.run(req, res),
      err,
      "throws error called with next(err)"
    );
  });
});
