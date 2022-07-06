import { test } from "tap";
import { spyOn } from "tinyspy";
import { createEdgeRouter, EdgeRouter, getPathname } from "../src/edge.js";

const METHODS = ["GET", "HEAD", "PATCH", "DELETE", "POST", "PUT"];

test("internals", (t) => {
  const ctx = new EdgeRouter();
  t.ok(ctx instanceof EdgeRouter, "creates new `Router` instance");
  t.ok(Array.isArray(ctx.routes), "~> has `routes` key (Array)");
  t.type(ctx.add, "function", "~> has `add` method");
  t.type(ctx.find, "function", "~> has `find` method");
  t.type(ctx.all, "function", "~> has `all` method");
  METHODS.forEach((str) => {
    t.type(ctx[str.toLowerCase()], "function", `~> has \`${str}\` method`);
  });
  t.end();
});

test("createEdgeRouter() returns an instance", async (t) => {
  t.ok(createEdgeRouter() instanceof EdgeRouter);
});

test("run() - runs req and evt through fns and return last value", async (t) => {
  t.plan(7);
  const ctx = createEdgeRouter();
  const req = { url: "http://localhost/foo/bar", method: "POST" } as Request;
  const evt = {};
  const badFn = () => t.fail("test error");
  ctx.use("/", (reqq, evtt, next) => {
    t.equal(reqq, req, "passes along req");
    t.equal(evtt, evt, "passes along evt");
    return next();
  });
  ctx.use("/not/match", badFn);
  ctx.get("/", badFn);
  ctx.get("/foo/bar", badFn);
  ctx.post("/foo/bar", async (reqq, evtt, next) => {
    t.equal(reqq, req, "passes along req");
    t.equal(evtt, evt, "passes along evt");
    return next();
  });
  ctx.use("/foo", (reqq, evtt) => {
    t.equal(reqq, req, "passes along req");
    t.equal(evtt, evt, "passes along evt");
    return "ok";
  });
  t.equal(await ctx.run(req, evt), "ok");
});

test("run() - propagates error", async (t) => {
  const req = { url: "http://localhost/", method: "GET" } as Request;
  const evt = {};
  const err = new Error("💥");
  await t.rejects(
    () =>
      createEdgeRouter()
        .use((_, __, next) => {
          next();
        })
        .use(() => {
          throw err;
        })
        .run(req, evt),
    err
  );

  await t.rejects(
    () =>
      createEdgeRouter()
        .use((_, __, next) => {
          return next();
        })
        .use(async () => {
          throw err;
        })
        .run(req, evt),
    err
  );

  await t.rejects(
    () =>
      createEdgeRouter()
        .use((_, __, next) => {
          return next();
        })
        .use(async (_, __, next) => {
          await next();
        })
        .use(() => Promise.reject(err))
        .run(req, evt),
    err
  );
});

test("run() - returns if no fns", async (t) => {
  const req = { url: "http://localhost/foo/bar", method: "GET" } as Request;
  const evt = {};
  const ctx = createEdgeRouter();
  const badFn = () => t.fail("test error");
  ctx.get("/foo", badFn);
  ctx.post("/foo/bar", badFn);
  ctx.use("/bar", badFn);
  return t
    .resolves(() => ctx.run(req, evt))
    .then((val) => t.equal(val, undefined));
});

test("handler() - basic", async (t) => {
  t.type(createEdgeRouter().handler(), "function", "returns a function");
});

test("handler() - handles incoming and returns value (sync)", async (t) => {
  t.plan(4);
  const response = new Response("");
  let i = 0;
  const req = { method: "GET", url: "http://localhost/" } as Request;
  const badFn = () => t.fail("test error");
  const res = await createEdgeRouter()
    .use((req, evt, next) => {
      t.equal(++i, 1);
      return next();
    })
    .use((req, evt, next) => {
      t.equal(++i, 2);
      return next();
    })
    .post(badFn)
    .get("/not/match", badFn)
    .get(() => {
      t.equal(++i, 3);
      return response;
    })
    .handler()(req, {});
  t.equal(res, response, "resolve with response (sync)");
});

test("handler() - handles incoming and returns value (async)", async (t) => {
  t.plan(4);
  const response = new Response("");
  let i = 0;
  const req = { method: "GET", url: "http://localhost/" } as Request;
  const badFn = () => t.fail("test error");
  const res = await createEdgeRouter()
    .use(async (req, evt, next) => {
      t.equal(++i, 1);
      const val = await next();
      return val;
    })
    .use((req, evt, next) => {
      t.equal(++i, 2);
      return next();
    })
    .post(badFn)
    .get("/not/match", badFn)
    .get(async () => {
      t.equal(++i, 3);
      return response;
    })
    .handler()(req, {});
  t.equal(res, response, "resolve with response (async)");
});

test("handler() - calls onError if error thrown (sync)", async (t) => {
  t.plan(3 * 3);
  const error = new Error("💥");
  const consoleSpy = spyOn(globalThis.console, "error", () => undefined);

  const badFn = () => t.fail("test error");
  const baseFn = (req: Request, evt: unknown, next: any) => {
    return next();
  };

  let idx = 0;
  const testResponse = async (response: Response) => {
    t.equal(response.status, 500, "set 500 status code");
    t.equal(await response.text(), "Internal Server Error");
    t.same(consoleSpy.calls[idx], [error], `called console.error ${idx}`);
    idx += 1;
  };

  const req = { method: "GET", url: "http://localhost/" } as Request;
  await createEdgeRouter()
    .use(baseFn)
    .use(() => {
      throw error;
    })
    .get(badFn)
    .handler()(req, {})
    .then(testResponse);
  await createEdgeRouter()
    .use(baseFn)
    .use((req, evt, next) => {
      next();
    })
    .get(() => {
      throw error;
    })
    .handler()(req, {})
    .then(testResponse);

  await createEdgeRouter()
    .use(baseFn)
    .get(() => {
      // non error throw
      throw "";
    })
    .handler()(req, {})
    .then(async (res: Response) => {
      t.equal(res.status, 500);
      t.equal(await res.text(), "Internal Server Error");
      t.same(consoleSpy.calls[idx], [""], `called console.error with ""`);
    });

  consoleSpy.restore();
});

test("handler() - calls onError if error thrown (async)", async (t) => {
  t.plan(2 * 3);
  const error = new Error("💥");
  const consoleSpy = spyOn(globalThis.console, "error", () => undefined);

  const badFn = () => t.fail("test error");

  let idx = 0;
  const testResponse = async (response: Response) => {
    t.equal(response.status, 500, "set 500 status code");
    t.equal(await response.text(), "Internal Server Error");
    t.same(consoleSpy.calls[idx], [error], `called console.error ${idx}`);
    idx += 1;
  };

  const req = { method: "GET", url: "http://localhost/" } as Request;

  const baseFn = (req: Request, evt: unknown, next: any) => {
    return next();
  };
  await createEdgeRouter()
    .use(baseFn)
    .use(async () => {
      return Promise.reject(error);
    })
    .get(badFn)
    .handler()(req, {})
    .then(testResponse);
  await createEdgeRouter()
    .use(baseFn)
    .get(() => {
      throw error;
    })
    .handler()(req, {})
    .then(testResponse);

  consoleSpy.restore();
});

test("handler() - calls custom onError", async (t) => {
  t.plan(1);
  await createEdgeRouter()
    .get(() => {
      throw new Error("💥");
    })
    .handler({
      onError(err) {
        t.equal((err as Error).message, "💥");
      },
    })({ method: "GET", url: "http://localhost/" } as Request, {});
});

test("handler() - calls onNoMatch if no fns matched", async (t) => {
  t.plan(2);
  const req = { url: "http://localhost/foo/bar", method: "GET" } as Request;
  const res: Response = await createEdgeRouter()
    .get("/foo")
    .post("/foo/bar")
    .handler()(req, {});
  t.equal(res.status, 404);
  t.equal(await res.text(), "Route GET http://localhost/foo/bar not found");
});

test("handler() - calls onNoMatch if only middle fns found", async (t) => {
  t.plan(2);
  const badFn = () => t.fail("test error");
  const req = { url: "http://localhost/foo/bar", method: "GET" } as Request;
  const res: Response = await createEdgeRouter()
    .use("", badFn)
    .use("/foo", badFn)
    .handler()(req, {});
  t.equal(res.status, 404);
  t.equal(await res.text(), "Route GET http://localhost/foo/bar not found");
});

test("handler() - calls onNoMatch if no fns matched (HEAD)", async (t) => {
  t.plan(2);
  const req = { url: "http://localhost/foo/bar", method: "HEAD" } as Request;
  const res: Response = await createEdgeRouter()
    .get("/foo")
    .post("/foo/bar")
    .handler()(req, {});
  t.equal(res.status, 404);
  t.equal(await res.text(), "");
});

test("handler() - calls custom onNoMatch if not found", async (t) => {
  t.plan(1);
  await createEdgeRouter().handler({
    onNoMatch() {
      t.pass("onNoMatch called");
    },
  })({ url: "http://localhost/foo/bar", method: "GET" } as Request, {});
});

test("handler() - calls onError if custom onNoMatch throws", async (t) => {
  t.plan(2);
  await createEdgeRouter().handler({
    onNoMatch() {
      t.pass("onNoMatch called");
      throw new Error("💥");
    },
    onError(err) {
      t.equal((err as Error).message, "💥");
    },
  })({ url: "http://localhost/foo/bar", method: "GET" } as Request, {});
});

test("prepareRequest() - attach params", async (t) => {
  const req = {} as Request & { params?: Record<string, string> };

  const ctx2 = createEdgeRouter().get("/hello/:name");
  // @ts-expect-error: internal
  ctx2.prepareRequest(req, {}, ctx2.find("GET", "/hello/world"));
  t.same(req.params, { name: "world" }, "params are attached");

  const reqWithParams = {
    params: { age: "20" },
  };
  // @ts-expect-error: internal
  ctx2.prepareRequest(
    reqWithParams as unknown as Request,
    {},
    ctx2.find("GET", "/hello/world")
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
    reqWithParams2 as unknown as Request,
    {},
    ctx2.find("GET", "/hello/world")
  );
  t.same(
    reqWithParams2.params,
    { name: "sunshine" },
    "params are merged (existing takes precedence)"
  );
});

test("getPathname() - returns pathname correctly", async (t) => {
  t.equal(
    getPathname({ url: "http://google.com/foo/bar" } as Request),
    "/foo/bar"
  );
  t.equal(
    getPathname({ url: "http://google.com/foo/bar?q=quz" } as Request),
    "/foo/bar"
  );
  t.equal(
    getPathname({
      url: "http://google.com/do/not/use/me",
      nextUrl: new URL("http://google.com/foo/bar?q=quz"),
    } as unknown as Request),
    "/foo/bar",
    "get pathname using req.nextUrl"
  );
});
