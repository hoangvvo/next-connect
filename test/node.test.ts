import type { IncomingMessage, ServerResponse } from "http";
import { test } from "tap";
import { createRouter, getPathname, NodeRouter } from "../src/node.js";

const METHODS = ["GET", "HEAD", "PATCH", "DELETE", "POST", "PUT"];

test("internals", (t) => {
  const ctx = new NodeRouter();
  t.ok(ctx instanceof NodeRouter, "creates new `Router` instance");
  t.ok(Array.isArray(ctx.routes), "~> has `routes` key (Array)");
  t.type(ctx.add, "function", "~> has `add` method");
  t.type(ctx.find, "function", "~> has `find` method");
  t.type(ctx.all, "function", "~> has `all` method");
  METHODS.forEach((str) => {
    t.type(ctx[str.toLowerCase()], "function", `~> has \`${str}\` method`);
  });
  t.end();
});

test("createRouter() returns an instance", async (t) => {
  t.ok(createRouter() instanceof NodeRouter);
});

test("run() - runs req and res through fns and return last value", async (t) => {
  t.plan(7);
  const ctx = new NodeRouter();
  const req = { url: "/foo/bar", method: "POST" } as IncomingMessage;
  const res = {} as ServerResponse;
  const badFn = () => t.fail("test error");
  ctx.use("/", (reqq, ress, next) => {
    t.equal(reqq, req, "passes along req");
    t.equal(ress, res, "passes along req");
    return next();
  });
  ctx.use("/not/match", badFn);
  ctx.get("/", badFn);
  ctx.get("/foo/bar", badFn);
  ctx.post("/foo/bar", async (reqq, ress, next) => {
    t.equal(reqq, req, "passes along req");
    t.equal(ress, res, "passes along req");
    return next();
  });
  ctx.use("/foo", (reqq, ress) => {
    t.equal(reqq, req, "passes along req");
    t.equal(ress, res, "passes along req");
    return "ok";
  });
  t.equal(await ctx.run(req, res), "ok");
});

test("run() - propagates error", async (t) => {
  const req = { url: "/", method: "GET" } as IncomingMessage;
  const res = {} as ServerResponse;
  const err = new Error("💥");
  await t.rejects(
    () =>
      new NodeRouter()
        .use((_, __, next) => {
          next();
        })
        .use(() => {
          throw err;
        })
        .run(req, res),
    err
  );

  await t.rejects(
    () =>
      new NodeRouter()
        .use((_, __, next) => {
          return next();
        })
        .use(async () => {
          throw err;
        })
        .run(req, res),
    err
  );

  await t.rejects(
    () =>
      new NodeRouter()
        .use((_, __, next) => {
          return next();
        })
        .use(async (_, __, next) => {
          await next();
        })
        .use(() => Promise.reject(err))
        .run(req, res),
    err
  );
});

test("run() - returns if no fns", async (t) => {
  const req = { url: "/foo/bar", method: "GET" } as IncomingMessage;
  const res = {} as ServerResponse;
  const ctx = new NodeRouter();
  const badFn = () => t.fail("test error");
  ctx.get("/foo", badFn);
  ctx.post("/foo/bar", badFn);
  ctx.use("/bar", badFn);
  return t
    .resolves(() => ctx.run(req, res))
    .then((val) => t.equal(val, undefined));
});

test("handler() - basic", async (t) => {
  t.type(new NodeRouter().handler(), "function", "returns a function");
});

test("handler() - handles incoming (sync)", async (t) => {
  t.plan(3);
  let i = 0;
  const req = { method: "GET", url: "/" } as IncomingMessage;
  const res = {} as ServerResponse;
  const badFn = () => t.fail("test error");
  await new NodeRouter()
    .use((req, res, next) => {
      t.equal(++i, 1);
      next();
    })
    .use((req, res, next) => {
      t.equal(++i, 2);
      next();
    })
    .post(badFn)
    .get("/not/match", badFn)
    .get(() => {
      t.equal(++i, 3);
    })
    .handler()(req, res);
});

test("handler() - handles incoming (async)", async (t) => {
  t.plan(3);
  let i = 0;
  const req = { method: "GET", url: "/" } as IncomingMessage;
  const res = {} as ServerResponse;
  const badFn = () => t.fail("test error");
  await new NodeRouter()
    .use(async (req, res, next) => {
      t.equal(++i, 1);
      await next();
    })
    .use((req, res, next) => {
      t.equal(++i, 2);
      return next();
    })
    .post(badFn)
    .get("/not/match", badFn)
    .get(async () => {
      t.equal(++i, 3);
    })
    .handler()(req, res);
});

test("handler() - calls onError if error thrown (sync)", async (t) => {
  t.plan(9);
  const baseFn = (req: IncomingMessage, res: ServerResponse, next: any) => {
    res.statusCode = 200;
    return next();
  };
  const req = { method: "GET", url: "/" } as IncomingMessage;
  const res = {
    end(chunk) {
      t.equal(res.statusCode, 500);
      t.ok(chunk.startsWith("Error: 💥"));
    },
  } as ServerResponse;
  await t.resolves(
    new NodeRouter()
      .use(baseFn)
      .use(() => {
        throw new Error("💥");
      })
      .get(() => {
        t.fail("test error");
      })
      .handler()(req, res),
    "to resolve"
  );
  await t.resolves(
    new NodeRouter()
      .use(baseFn)
      .use((req, res, next) => {
        next();
      })
      .get(() => {
        throw new Error("💥");
      })
      .handler()(req, res),
    "to resolve"
  );
  const res2 = {
    end(chunk) {
      t.equal(res.statusCode, 500);
      t.equal(chunk, undefined);
    },
  } as ServerResponse;
  await t.resolves(
    new NodeRouter()
      .use(baseFn)
      .get(() => {
        // non error throw
        throw "";
      })
      .handler()(req, res2),
    "to resolve"
  );
});

test("handler() - calls onError if error thrown (async)", async (t) => {
  t.plan(6);
  const req = { method: "GET", url: "/" } as IncomingMessage;
  const res = {
    end(chunk) {
      t.equal(this.statusCode, 500);
      t.ok(chunk.startsWith("Error: 💥"));
    },
  } as ServerResponse;
  const baseFn = async (
    req: IncomingMessage,
    res: ServerResponse,
    next: any
  ) => {
    res.statusCode = 200;
    return next();
  };
  await t.resolves(
    new NodeRouter()
      .use(baseFn)
      .use(async () => {
        return Promise.reject(new Error("💥"));
      })
      .get(() => {
        t.fail("test error");
      })
      .handler()(req, res),
    "to resolve"
  );
  await t.resolves(
    new NodeRouter()
      .use(baseFn)
      .get(() => {
        throw new Error("💥");
      })
      .handler()(req, res),
    "to resolve"
  );
});

test("handler() - calls custom onError", async (t) => {
  t.plan(2);
  await t.resolves(
    new NodeRouter()
      .get(() => {
        throw new Error("💥");
      })
      .handler({
        onError(err) {
          t.equal((err as Error).message, "💥");
        },
      })({ method: "GET", url: "/" } as IncomingMessage, {} as ServerResponse),
    "to resolve"
  );
});

test("handler() - calls onNoMatch if no fns matched", async (t) => {
  t.plan(3);
  const req = { url: "/foo/bar", method: "GET" } as IncomingMessage;
  const res = {
    end(chunk) {
      t.equal(this.statusCode, 404);
      t.equal(chunk, "Route GET /foo/bar not found");
    },
  } as ServerResponse;
  await t.resolves(
    new NodeRouter().get("/foo").post("/foo/bar").handler()(req, res)
  );
});

test("handler() - calls onNoMatch if only middle fns found", async (t) => {
  t.plan(3);
  const req = { url: "/foo/bar", method: "GET" } as IncomingMessage;
  const res = {
    end(chunk) {
      t.equal(this.statusCode, 404);
      t.equal(chunk, "Route GET /foo/bar not found");
    },
  } as ServerResponse;
  await t.resolves(
    new NodeRouter()
      .use("", (req, res, next) => {
        t.fail("test error");
        next();
      })
      .use("/foo", () => t.fail("test error"))
      .handler()(req, res)
  );
});

test("handler() - calls custom onNoMatch if not found", async (t) => {
  t.plan(2);
  await t.resolves(
    new NodeRouter().handler({
      onNoMatch() {
        t.pass("onNoMatch called");
      },
    })(
      { url: "/foo/bar", method: "GET" } as IncomingMessage,
      {} as ServerResponse
    )
  );
});

test("handler() - calls onError if custom onNoMatch throws", async (t) => {
  t.plan(3);
  await t.resolves(
    new NodeRouter().handler({
      onNoMatch() {
        t.pass("onNoMatch called");
        throw new Error("💥");
      },
      onError(err) {
        t.equal((err as Error).message, "💥");
      },
    })(
      { url: "/foo/bar", method: "GET" } as IncomingMessage,
      {} as ServerResponse
    )
  );
});

test("getPathname() - returns pathname correctly", async (t) => {
  t.equal(getPathname("/foo/bar"), "/foo/bar");
  t.equal(getPathname("/foo/bar?q=quz"), "/foo/bar");
});
