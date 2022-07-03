/**
 * Adapted from lukeed/trouter library:
 * https://github.com/lukeed/trouter/blob/master/test/index.js
 */
import { test } from "tap";
import type { Route } from "../src/router.js";
import { Router } from "../src/router.js";
import type { HttpMethod, Nextable } from "../src/types.js";

type AnyHandler = (...args: any[]) => any;

const noop = async () => {
  /** noop */
};

const METHODS = ["GET", "HEAD", "PATCH", "DELETE", "POST", "PUT"];

const testRoute = (
  t: Tap.Test,
  rr: Route<any>,
  { route, ...match }: Partial<Route<any> & { route: string }>
) => {
  // @ts-expect-error: pattern does not always exist
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { pattern, ...r } = rr;
  t.same(r, match, `~> has same route`);
  if (route) {
    const testCtx = new Router();
    testCtx.routes = [rr];
    t.ok(
      testCtx.find(match.method as HttpMethod, route).fns.length > 0,
      "~~> pattern satisfies route"
    );
  }
};

test("internals", (t) => {
  const ctx = new Router<AnyHandler>();
  t.ok(ctx instanceof Router, "creates new `Router` instance");
  t.ok(Array.isArray(ctx.routes), "~> has `routes` key (Array)");
  t.type(ctx.add, "function", "~> has `add` method");
  t.type(ctx.find, "function", "~> has `find` method");
  t.type(ctx.all, "function", "~> has `all` method");
  METHODS.forEach((str) => {
    t.type(ctx[str.toLowerCase()], "function", `~> has \`${str}\` method`);
  });

  t.end();
});

test("add()", (t) => {
  const ctx = new Router<AnyHandler>();

  const out = ctx.add("GET", "/foo/:hello", noop);
  t.same(out, ctx, "returns the Router instance (chainable)");

  t.equal(ctx.routes.length, 1, 'added "GET /foo/:hello" route successfully');

  testRoute(t, ctx.routes[0], {
    fns: [noop],
    method: "GET",
    isMiddle: false,
    keys: ["hello"],
    route: "/foo/bar",
  });

  ctx.post("bar", noop);
  t.equal(
    ctx.routes.length,
    2,
    'added "POST /bar" route successfully (via alias)'
  );

  testRoute(t, ctx.routes[1], {
    fns: [noop],
    keys: [],
    method: "POST",
    isMiddle: false,
    route: "/bar",
  });

  ctx.add("PUT", /^[/]foo[/](?<hello>\w+)[/]?$/, noop);
  t.same(
    ctx.routes.length,
    3,
    'added "PUT /^[/]foo[/](?<hello>\\w+)[/]?$/" route successfully'
  );

  testRoute(t, ctx.routes[2], {
    fns: [noop],
    keys: false,
    method: "PUT",
    isMiddle: false,
  });

  t.end();
});

test("add() - multiple", (t) => {
  const ctx = new Router<AnyHandler>();

  ctx.add("PATCH", "/foo/:hello", noop, noop);
  t.same(ctx.routes.length, 1, 'added "SEARCH /foo/:hello" route successfully');

  testRoute(t, ctx.routes[0], {
    fns: [noop, noop],
    keys: ["hello"],
    method: "PATCH",
    route: "/foo/howdy",
    isMiddle: false,
  });

  ctx.put("/bar", noop, noop, noop);
  t.same(
    ctx.routes.length,
    2,
    'added "PUT /bar" route successfully (via alias)'
  );

  testRoute(t, ctx.routes[1], {
    fns: [noop, noop, noop],
    keys: [],
    method: "PUT",
    route: "/bar",
    isMiddle: false,
  });

  t.end();
});

test("use()", (t) => {
  const ctx = new Router<AnyHandler>();

  const out = ctx.use("/foo/:hello", noop);
  t.same(out, ctx, "returns the Router instance (chainable)");

  t.same(ctx.routes.length, 1, 'added "ANY /foo/:hello" route successfully');

  testRoute(t, ctx.routes[0], {
    method: "",
    keys: ["hello"],
    route: "/foo/bar",
    fns: [noop],
    isMiddle: true,
  });

  ctx.use("/", noop, noop, noop);
  t.same(ctx.routes.length, 2, 'added "ANY /" routes successfully');

  testRoute(t, ctx.routes[1], {
    keys: [],
    method: "",
    route: "/",
    fns: [noop, noop, noop],
    isMiddle: true,
  });

  ctx.use("/foo/:world?", noop, noop, noop, noop);
  t.same(ctx.routes.length, 3, 'added "ANY /foo/:world?" routes successfully');

  testRoute(t, ctx.routes[2], {
    keys: ["world"],
    method: "",
    route: "/foo/hello",
    fns: [noop, noop, noop, noop],
    isMiddle: true,
  });

  t.end();
});

test("all()", (t) => {
  const fn: AnyHandler = (req: any) => req.chain++;
  const ctx = new Router<AnyHandler>().all("/greet/:name", fn);
  t.same(ctx.routes.length, 1, 'added "ALL /greet/:name" route');

  testRoute(t, ctx.routes[0], {
    method: "", // ~> "ALL"
    keys: ["name"],
    route: "/greet/you",
    fns: [fn],
    isMiddle: false,
  });

  const foo = ctx.find("HEAD", "/greet/Bob") as any;
  t.same(foo.params.name, "Bob", '~> "params.name" is expected');
  t.same(foo.fns.length, 1, '~~> "handlers" has 1 item');

  foo.chain = 0;
  foo.fns.forEach((fn) => fn(foo));
  t.same(foo.chain, 1, "~~> handler executed successfully");

  const bar = ctx.find("GET", "/greet/Judy") as any;
  t.same(bar.params.name, "Judy", '~> "params.name" is expected');
  t.same(bar.fns.length, 1, '~~> "handlers" has 1 item');

  bar.chain = 0;
  bar.fns.forEach((fn) => fn(bar));
  t.same(bar.chain, 1, "~~> handler executed successfully");

  const fn2: AnyHandler = (req: any) => {
    t.same(req.chain++, 1, "~> ran new HEAD after ALL handler");
    t.same(req.params.name, "Rick", '~~> still see "params.name" value');
    t.same(req.params.person, "Rick", '~~> receives "params.person" value');
  };
  ctx.head("/greet/:person", fn2);

  t.same(ctx.routes.length, 2, 'added "HEAD /greet/:name" route');

  testRoute(t, ctx.routes[1], {
    method: "HEAD", // ~> "ALL"
    keys: ["person"],
    route: "/greet/you",
    fns: [fn2],
    isMiddle: false,
  });

  const baz = ctx.find("HEAD", "/greet/Rick") as any;
  t.same(baz.params.name, "Rick", '~> "params.name" is expected');
  t.same(baz.fns.length, 2, '~~> "handlers" has 2 items');

  baz.chain = 0;
  baz.fns.forEach((fn) => fn(baz));
  t.same(baz.chain, 2, "~~> handlers executed successfully");

  const bat = ctx.find("POST", "/greet/Morty") as any;
  t.same(bat.params.name, "Morty", '~> "params.name" is expected');
  t.same(bat.fns.length, 1, '~~> "handlers" has 1 item');

  bat.chain = 0;
  bat.fns.forEach((fn) => fn(bat));
  t.same(bat.chain, 1, "~~> handler executed successfully");

  t.end();
});

test("find()", (t) => {
  t.plan(9);

  const ctx = new Router<AnyHandler>();

  ctx.get(
    "/foo/:title",
    ((req) => {
      t.same(req.chain++, 1, '~> 1st "GET /foo/:title" ran first');
      t.same(req.params.title, "bar", '~> "params.title" is expected');
    }) as AnyHandler,
    ((req) => {
      t.same(req.chain++, 2, '~> 2nd "GET /foo/:title" ran second');
    }) as AnyHandler
  );

  const out = ctx.find("GET", "/foo/bar") as any;

  t.type(out, "object", "returns an object");
  t.type(out.params, "object", '~> has "params" key (object)');
  t.same(out.params.title, "bar", '~~> "params.title" value is correct');

  t.ok(Array.isArray(out.fns), `~> has "handlers" key (array)`);
  t.same(out.fns.length, 2, "~~> saved both handlers");

  out.chain = 1;
  out.fns.forEach((fn) => fn(out));
  t.same(out.chain, 3, "~> executes the handler group sequentially");
});

test("find() - no match", (t) => {
  const ctx = new Router<AnyHandler>();
  const out = ctx.find("DELETE", "/nothing");

  t.type(out, "object", "returns an object");
  t.same(Object.keys(out.params).length, 0, '~> "params" is empty');
  t.same(out.fns.length, 0, '~> "handlers" is empty');
  t.end();
});

test("find() - multiple", (t) => {
  t.plan(18);

  const ctx = new Router<AnyHandler>()
    .use("/foo", ((req) => {
      t.pass('~> ran use("/foo")" route'); // x2
      isRoot || t.same(req.params.title, "bar", '~~> saw "param.title" value');
      t.same(req.chain++, 0, "~~> ran 1st");
    }) as AnyHandler)
    .get("/foo", ((req) => {
      t.pass('~> ran "GET /foo" route');
      t.same(req.chain++, 1, "~~> ran 2nd");
    }) as AnyHandler)
    .get("/foo/:title?", ((req) => {
      t.pass('~> ran "GET /foo/:title?" route'); // x2
      isRoot || t.same(req.params.title, "bar", '~~> saw "params.title" value');
      isRoot
        ? t.same(req.chain++, 2, "~~> ran 3rd")
        : t.same(req.chain++, 1, "~~> ran 2nd");
    }) as AnyHandler)
    .get("/foo/*", ((req) => {
      t.pass('~> ran "GET /foo/*" route');
      t.same(req.params.wild, "bar", '~~> saw "params.wild" value');
      t.same(req.params.title, "bar", '~~> saw "params.title" value');
      t.same(req.chain++, 2, "~~> ran 3rd");
    }) as AnyHandler);

  let isRoot = true;
  const foo = ctx.find("GET", "/foo") as any;
  t.same(foo.fns.length, 3, "found 3 handlers");

  foo.chain = 0;
  foo.fns.forEach((fn) => fn(foo));

  isRoot = false;
  const bar = ctx.find("GET", "/foo/bar") as any;
  t.same(bar.fns.length, 3, "found 3 handlers");

  bar.chain = 0;
  bar.fns.forEach((fn) => fn(bar));
});

test("find() - HEAD", (t) => {
  t.plan(5);
  const ctx = new Router<AnyHandler>()
    .all("/foo", ((req) => {
      t.same(req.chain++, 0, '~> found "ALL /foo" route');
    }) as AnyHandler)
    .head("/foo", ((req) => {
      t.same(req.chain++, 1, '~> found "HEAD /foo" route');
    }) as AnyHandler)
    .get("/foo", ((req) => {
      t.same(req.chain++, 2, '~> also found "GET /foo" route');
    }) as AnyHandler)
    .get("/", () => {
      t.pass("should not run");
    });

  const out = ctx.find("HEAD", "/foo") as any;
  t.same(out.fns.length, 3, "found 3 handlers");

  out.chain = 0;
  out.fns.forEach((fn) => fn(out));
  t.same(out.chain, 3, "ran handlers sequentially");
});

test("find() - order", (t) => {
  t.plan(5);
  const ctx = new Router<AnyHandler>()
    .all("/foo", ((req) => {
      t.same(req.chain++, 0, '~> ran "ALL /foo" 1st');
    }) as AnyHandler)
    .get("/foo", ((req) => {
      t.same(req.chain++, 1, '~> ran "GET /foo" 2nd');
    }) as AnyHandler)
    .head("/foo", ((req) => {
      t.same(req.chain++, 2, '~> ran "HEAD /foo" 3rd');
    }) as AnyHandler)
    .get("/", (() => {
      t.pass("should not run");
    }) as AnyHandler);

  const out = ctx.find("HEAD", "/foo") as any;
  t.same(out.fns.length, 3, "found 3 handlers");

  out.chain = 0;
  out.fns.forEach((fn) => fn(out));
  t.same(out.chain, 3, "ran handlers sequentially");
});

test("find() w/ all()", (t) => {
  const noop = () => {
    /** noop */
  };
  const find = (x, y) => x.find("GET", y);

  const ctx1 = new Router<AnyHandler>().all("api", noop);
  const ctx2 = new Router<AnyHandler>().all("api/:version", noop);
  const ctx3 = new Router<AnyHandler>().all("api/:version?", noop);
  const ctx4 = new Router<AnyHandler>().all("movies/:title.mp4", noop);

  t.same(find(ctx1, "/api").fns.length, 1, "~> exact match");
  t.same(
    find(ctx1, "/api/foo").fns.length,
    0,
    '~> does not match "/api/foo" - too long'
  );

  t.same(find(ctx2, "/api").fns.length, 0, '~> does not match "/api" only');

  const foo1 = find(ctx2, "/api/v1");
  t.same(foo1.fns.length, 1, '~> does match "/api/v1" directly');
  t.same(foo1.params.version, "v1", '~> parses the "version" correctly');

  const foo2 = find(ctx2, "/api/v1/users");
  t.same(foo2.fns.length, 0, '~> does not match "/api/v1/users" - too long');
  t.same(
    foo2.params.version,
    undefined,
    '~> cannot parse the "version" parameter (not a match)'
  );

  t.same(
    find(ctx3, "/api").fns.length,
    1,
    '~> does match "/api" because optional'
  );

  const bar1 = find(ctx3, "/api/v1");
  t.same(bar1.fns.length, 1, '~> does match "/api/v1" directly');
  t.same(bar1.params.version, "v1", '~> parses the "version" correctly');

  const bar2 = find(ctx3, "/api/v1/users");
  t.same(bar2.fns.length, 0, '~> does match "/api/v1/users" - too long');
  t.same(
    bar2.params.version,
    undefined,
    '~> cannot parse the "version" parameter (not a match)'
  );

  t.same(
    find(ctx4, "/movies").fns.length,
    0,
    '~> does not match "/movies" directly'
  );
  t.same(
    find(ctx4, "/movies/narnia").fns.length,
    0,
    '~> does not match "/movies/narnia" directly'
  );

  const baz1 = find(ctx4, "/movies/narnia.mp4");
  t.same(baz1.fns.length, 1, '~> does match "/movies/narnia.mp4" directly');
  t.same(baz1.params.title, "narnia", '~> parses the "title" correctly');

  const baz2 = find(ctx4, "/movies/narnia.mp4/cast");
  t.same(
    baz2.fns.length,
    0,
    '~> does match "/movies/narnia.mp4/cast" - too long'
  );
  t.same(
    baz2.params.title,
    undefined,
    '~> cannot parse the "title" parameter (not a match)'
  );

  t.end();
});

test("find() w/ use()", (t) => {
  const noop = () => {
    /** noop */
  };
  const find = (x, y) => x.find("GET", y);

  const ctx1 = new Router<AnyHandler>().use("api", noop);
  const ctx2 = new Router<AnyHandler>().use("api/:version", noop);
  const ctx3 = new Router<AnyHandler>().use("api/:version?", noop);
  const ctx4 = new Router<AnyHandler>().use("movies/:title.mp4", noop);

  t.same(find(ctx1, "/api").fns.length, 1, "~> exact match");
  t.same(find(ctx1, "/api/foo").fns.length, 1, "~> loose match");

  t.same(find(ctx2, "/api").fns.length, 0, '~> does not match "/api" only');

  const foo1 = find(ctx2, "/api/v1");
  t.same(foo1.fns.length, 1, '~> does match "/api/v1" directly');
  t.same(foo1.params.version, "v1", '~> parses the "version" correctly');

  const foo2 = find(ctx2, "/api/v1/users");
  t.same(foo2.fns.length, 1, '~> does match "/api/v1/users" loosely');
  t.same(foo2.params.version, "v1", '~> parses the "version" correctly');

  t.same(
    find(ctx3, "/api").fns.length,
    1,
    '~> does match "/api" because optional'
  );

  const bar1 = find(ctx3, "/api/v1");
  t.same(bar1.fns.length, 1, '~> does match "/api/v1" directly');
  t.same(bar1.params.version, "v1", '~> parses the "version" correctly');

  const bar2 = find(ctx3, "/api/v1/users");
  t.same(bar2.fns.length, 1, '~> does match "/api/v1/users" loosely');
  t.same(bar2.params.version, "v1", '~> parses the "version" correctly');

  t.same(
    find(ctx4, "/movies").fns.length,
    0,
    '~> does not match "/movies" directly'
  );
  t.same(
    find(ctx4, "/movies/narnia").fns.length,
    0,
    '~> does not match "/movies/narnia" directly'
  );

  const baz1 = find(ctx4, "/movies/narnia.mp4");
  t.same(baz1.fns.length, 1, '~> does match "/movies/narnia.mp4" directly');
  t.same(baz1.params.title, "narnia", '~> parses the "title" correctly');

  const baz2 = find(ctx4, "/movies/narnia.mp4/cast");
  t.same(baz2.fns.length, 1, '~> does match "/movies/narnia.mp4/cast" loosely');
  t.same(baz2.params.title, "narnia", '~> parses the "title" correctly');

  t.end();
});

test("find() - regex w/ named groups", (t) => {
  t.plan(9);
  const ctx = new Router<AnyHandler>();

  ctx.get(
    /^[/]foo[/](?<title>\w+)[/]?$/,
    ((req) => {
      t.same(
        req.chain++,
        1,
        '~> 1st "GET /^[/]foo[/](?<title>\\w+)[/]?$/" ran first'
      );
      t.same(req.params.title, "bar", '~> "params.title" is expected');
    }) as AnyHandler,
    ((req) => {
      t.same(
        req.chain++,
        2,
        '~> 2nd "GET /^[/]foo[/](?<title>\\w+)[/]?$/" ran second'
      );
    }) as AnyHandler
  );

  const out = ctx.find("GET", "/foo/bar") as any;

  t.type(out, "object", "returns an object");
  t.type(out.params, "object", '~> has "params" key (object)');
  t.same(out.params.title, "bar", '~~> "params.title" value is correct');

  t.ok(Array.isArray(out.fns), `~> has "handlers" key (array)`);
  t.same(out.fns.length, 2, "~~> saved both handlers");

  out.chain = 1;
  out.fns.forEach((fn) => fn(out));
  t.same(out.chain, 3, "~> executes the handler group sequentially");
});

test("find() - multiple regex w/ named groups", (t) => {
  t.plan(18);

  const ctx = new Router<AnyHandler>()
    .use("/foo", ((req) => {
      t.pass('~> ran use("/foo")" route'); // x2
      isRoot || t.same(req.params.title, "bar", '~~> saw "params.title" value');
      t.same(req.chain++, 0, "~~> ran 1st");
    }) as AnyHandler)
    .get("/foo", ((req) => {
      t.pass('~> ran "GET /foo" route');
      t.same(req.chain++, 1, "~~> ran 2nd");
    }) as AnyHandler)
    .get(/^[/]foo(?:[/](?<title>\w+))?[/]?$/, ((req) => {
      t.pass('~> ran "GET /^[/]foo[/](?<title>\\w+)?[/]?$/" route'); // x2
      isRoot || t.same(req.params.title, "bar", '~~> saw "params.title" value');
      isRoot
        ? t.same(req.chain++, 2, "~~> ran 3rd")
        : t.same(req.chain++, 1, "~~> ran 2nd");
    }) as AnyHandler)
    .get(/^[/]foo[/](?<wild>.*)$/, ((req) => {
      t.pass('~> ran "GET /^[/]foo[/](?<wild>.*)$/" route');
      t.same(req.params.wild, "bar", '~~> saw "params.wild" value');
      t.same(req.params.title, "bar", '~~> saw "params.title" value');
      t.same(req.chain++, 2, "~~> ran 3rd");
    }) as AnyHandler);

  let isRoot = true;
  const foo = ctx.find("GET", "/foo") as any;
  t.same(foo.fns.length, 3, "found 3 handlers");

  foo.chain = 0;
  foo.fns.forEach((fn) => fn(foo));

  isRoot = false;
  const bar = ctx.find("GET", "/foo/bar") as any;
  t.same(bar.fns.length, 3, "found 3 handlers");

  bar.chain = 0;
  bar.fns.forEach((fn) => fn(bar));
});

/**
 * Additional handling tailored to next-connect
 */
test("add() - matches all if no route", (t) => {
  t.plan(4);
  const ctx = new Router();
  const fn = () => undefined;
  ctx.add("GET", fn);
  testRoute(t, ctx.routes[0], {
    route: "/some/wacky/route",
    fns: [fn],
    matchAll: true,
    isMiddle: false,
    method: "GET",
  });

  const ctx2 = new Router();
  ctx2.add("POST", "", fn);
  testRoute(t, ctx2.routes[0], {
    route: "/some/wacky/route",
    fns: [fn],
    matchAll: true,
    isMiddle: false,
    method: "POST",
  });
});

test("use() - default to / with no base", (t) => {
  t.plan(2);
  const ctx = new Router();
  const fn = () => undefined;
  ctx.use(fn);
  testRoute(t, ctx.routes[0], {
    keys: [],
    fns: [fn],
    isMiddle: true,
    method: "",
    route: "/some/wacky/route",
  });
});

test("exec() - execute handlers sequentially", async (t) => {
  t.plan(10);
  const rreq = {};
  const rres = {};
  let idx = 0;
  const fns: Nextable<
    (arg0: Record<string, unknown>, arg1: Record<string, unknown>) => void
  >[] = [
    async (req, res, next) => {
      t.equal(idx++, 0, "correct execution order");
      t.equal(req, rreq, "~~> passes all args");
      t.equal(res, rres, "~~> passes all args");
      t.type(next, "function", "~~> receives next function");
      const val = await next();
      t.equal(val, "bar", "~~> resolves the next handler");
      t.equal(idx++, 4, "correct execution order");
      return "final";
    },
    async (_req, _res, next) => {
      t.equal(idx++, 1, "correct execution order");
      await next();
      t.equal(idx++, 3, "correct execution order");
      return "bar";
    },
    async () => {
      t.equal(idx++, 2, "correct execution order");
      return "foo";
    },
    async () => {
      t.fail("don't call me");
    },
  ];
  t.equal(
    await Router.exec(fns, rreq, rres),
    "final",
    "~~> returns the final value"
  );
});

test("find() - returns middleOnly", async (t) => {
  const ctx = new Router();
  const fn = () => undefined;
  ctx.all("/this/will/not/match", fn);
  ctx.post("/bar", fn);
  ctx.use("/", fn);
  ctx.use("/foo", fn);

  await t.test("= true if only middles found", async (t) => {
    t.equal(ctx.find("GET", "/bar").middleOnly, true);
  });

  await t.test("= false if at least one non-middle found", async (t) => {
    t.equal(ctx.find("POST", "/bar").middleOnly, false);
  });
});
