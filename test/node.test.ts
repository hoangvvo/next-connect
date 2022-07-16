import type { IncomingMessage, ServerResponse } from "http";
import { test } from "tap";
import { spyOn } from "tinyspy";
import { createRouter, getPathname, NodeRouter } from "../src/node.js";
import { Router } from "../src/router.js";

type AnyHandler = (...args: any[]) => any;

const noop: AnyHandler = async () => {
  /** noop */
};

const METHODS = ["GET", "HEAD", "PATCH", "DELETE", "POST", "PUT"];

test("internals", (t) => {
  const ctx = new NodeRouter();
  t.ok(ctx instanceof NodeRouter, "creates new `NodeRouter` instance");
  // @ts-expect-error: internal
  t.ok(ctx.router instanceof Router, "~> has a `Router` instance");

  t.type(ctx.all, "function", "~> has `all` method");
  METHODS.forEach((str) => {
    t.type(ctx[str.toLowerCase()], "function", `~> has \`${str}\` method`);
  });
  t.end();
});

test("createRouter() returns an instance", async (t) => {
  t.ok(createRouter() instanceof NodeRouter);
});

test("add()", async (t) => {
  const ctx = new NodeRouter();
  // @ts-expect-error: private property
  const routerAddStub = spyOn(ctx.router, "add");
  // @ts-expect-error: private property
  const returned = ctx.add("GET", "/", noop);
  t.same(routerAddStub.calls, [["GET", "/", noop]], "call router.add()");
  t.equal(returned, ctx, "returned itself");
});

test("clone()", (t) => {
  const ctx = new NodeRouter();
  // @ts-expect-error: private property
  ctx.router.routes = [noop, noop] as any[];
  t.ok(ctx.clone() instanceof NodeRouter, "is a NodeRouter instance");
  t.not(ctx, ctx.clone(), "not the same identity");
  // @ts-expect-error: private property
  t.not(ctx.router, ctx.clone().router, "not the same router identity");
  t.not(
    // @ts-expect-error: private property
    ctx.router.routes,
    // @ts-expect-error: private property
    ctx.clone().router.routes,
    "routes are deep cloned (identity)"
  );
  t.same(
    // @ts-expect-error: private property
    ctx.router.routes,
    // @ts-expect-error: private property
    ctx.clone().router.routes,
    "routes are deep cloned"
  );
  t.end();
});

test("run() - runs req and res through fns and return last value", async (t) => {
  t.plan(7);
  const ctx = createRouter();
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
      createRouter()
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
      createRouter()
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
      createRouter()
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
  const ctx = createRouter();
  const badFn = () => t.fail("test error");
  ctx.get("/foo", badFn);
  ctx.post("/foo/bar", badFn);
  ctx.use("/bar", badFn);
  return t
    .resolves(() => ctx.run(req, res))
    .then((val) => t.equal(val, undefined));
});

test("handler() - basic", async (t) => {
  t.type(createRouter().handler(), "function", "returns a function");
});

test("handler() - handles incoming (sync)", async (t) => {
  t.plan(3);
  let i = 0;
  const req = { method: "GET", url: "/" } as IncomingMessage;
  const res = {} as ServerResponse;
  const badFn = () => t.fail("test error");
  await createRouter()
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
  await createRouter()
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
  t.plan(3 * 3);
  const error = new Error("💥");
  const consoleSpy = spyOn(globalThis.console, "error", () => undefined);

  const badFn = () => t.fail("test error");
  const baseFn = (req: IncomingMessage, res: ServerResponse, next: any) => {
    res.statusCode = 200;
    return next();
  };

  let idx = 0;

  const req = { method: "GET", url: "/" } as IncomingMessage;
  const res = {
    end(chunk) {
      t.equal(this.statusCode, 500, "set 500 status code");
      t.equal(chunk, "Internal Server Error");
      t.same(consoleSpy.calls[idx], [error], `called console.error ${idx}`);
      idx += 1;
    },
  } as ServerResponse;
  await createRouter()
    .use(baseFn)
    .use(() => {
      throw error;
    })
    .get(badFn)
    .handler()(req, res);
  await createRouter()
    .use(baseFn)
    .use((req, res, next) => {
      next();
    })
    .get(() => {
      throw error;
    })
    .handler()(req, res);

  const res2 = {
    end(chunk) {
      t.equal(res.statusCode, 500);
      t.equal(chunk, "Internal Server Error");
      t.same(consoleSpy.calls[idx], [""], `called console.error with ""`);
    },
  } as ServerResponse;
  await createRouter()
    .use(baseFn)
    .get(() => {
      // non error throw
      throw "";
    })
    .handler()(req, res2);

  consoleSpy.restore();
});

test("handler() - calls onError if error thrown (async)", async (t) => {
  t.plan(2 * 3);
  const error = new Error("💥");
  const consoleSpy = spyOn(globalThis.console, "error", () => undefined);

  const badFn = () => t.fail("test error");

  const req = { method: "GET", url: "/" } as IncomingMessage;
  let idx = 0;
  const res = {
    end(chunk) {
      t.equal(this.statusCode, 500);
      t.equal(chunk, "Internal Server Error");
      t.same(consoleSpy.calls[idx], [error], `called console.error ${idx}`);
      idx += 1;
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
  await createRouter()
    .use(baseFn)
    .use(async () => {
      return Promise.reject(error);
    })
    .get(badFn)
    .handler()(req, res);
  await createRouter()
    .use(baseFn)
    .get(() => {
      throw error;
    })
    .handler()(req, res);

  consoleSpy.restore();
});

test("handler() - calls custom onError", async (t) => {
  t.plan(1);
  await createRouter()
    .get(() => {
      throw new Error("💥");
    })
    .handler({
      onError(err) {
        t.equal((err as Error).message, "💥");
      },
    })({ method: "GET", url: "/" } as IncomingMessage, {} as ServerResponse);
});

test("handler() - calls onNoMatch if no fns matched", async (t) => {
  t.plan(2);
  const req = { url: "/foo/bar", method: "GET" } as IncomingMessage;
  const res = {
    end(chunk) {
      t.equal(this.statusCode, 404);
      t.equal(chunk, "Route GET /foo/bar not found");
    },
  } as ServerResponse;
  await createRouter().get("/foo").post("/foo/bar").handler()(req, res);
});

test("handler() - calls onNoMatch if only middle fns found", async (t) => {
  t.plan(2);
  const badFn = () => t.fail("test error");
  const req = { url: "/foo/bar", method: "GET" } as IncomingMessage;
  const res = {
    end(chunk) {
      t.equal(this.statusCode, 404);
      t.equal(chunk, "Route GET /foo/bar not found");
    },
  } as ServerResponse;
  await createRouter().use("", badFn).use("/foo", badFn).handler()(req, res);
});

test("handler() - calls onNoMatch if no fns matched (HEAD)", async (t) => {
  t.plan(2);
  const req = { url: "/foo/bar", method: "HEAD" } as IncomingMessage;
  const res = {
    end(chunk) {
      t.equal(this.statusCode, 404);
      t.equal(chunk, undefined);
    },
  } as ServerResponse;
  await createRouter().get("/foo").post("/foo/bar").handler()(req, res);
});

test("handler() - calls custom onNoMatch if not found", async (t) => {
  t.plan(1);
  await createRouter().handler({
    onNoMatch() {
      t.pass("onNoMatch called");
    },
  })(
    { url: "/foo/bar", method: "GET" } as IncomingMessage,
    {} as ServerResponse
  );
});

test("handler() - calls onError if custom onNoMatch throws", async (t) => {
  t.plan(2);
  await createRouter().handler({
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
  );
});

test("prepareRequest() - attach params", async (t) => {
  const req = {} as IncomingMessage;

  const ctx2 = createRouter().get("/hello/:name");
  // @ts-expect-error: internal
  ctx2.prepareRequest(
    req,
    {} as ServerResponse,
    // @ts-expect-error: internal
    ctx2.router.find("GET", "/hello/world")
  );
  // @ts-expect-error: extra prop
  t.same(req.params, { name: "world" }, "params are attached");

  const reqWithParams = {
    params: { age: "20" },
  };
  // @ts-expect-error: internal
  ctx2.prepareRequest(
    reqWithParams as unknown as IncomingMessage,
    {} as ServerResponse,
    // @ts-expect-error: internal
    ctx2.router.find("GET", "/hello/world")
  );
  t.same(
    reqWithParams.params,
    { name: "world", age: "20" },
    "params are merged"
  );

  const reqWithParams2 = {
    params: { name: "sunshine" },
  };
  // @ts-expect-error: internal
  ctx2.prepareRequest(
    reqWithParams2 as unknown as IncomingMessage,
    {} as ServerResponse,
    // @ts-expect-error: internal
    ctx2.router.find("GET", "/hello/world")
  );
  t.same(
    reqWithParams2.params,
    { name: "sunshine" },
    "params are merged (existing takes precedence)"
  );
});

test("getPathname() - returns pathname correctly", async (t) => {
  t.equal(getPathname("/foo/bar"), "/foo/bar");
  t.equal(getPathname("/foo/bar?q=quz"), "/foo/bar");
});
