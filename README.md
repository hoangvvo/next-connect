# next-connect

[![npm](https://badgen.net/npm/v/next-connect)](https://www.npmjs.com/package/next-connect)
[![CircleCI](https://circleci.com/gh/hoangvvo/next-connect.svg?style=svg)](https://circleci.com/gh/hoangvvo/next-connect)
[![codecov](https://codecov.io/gh/hoangvvo/next-connect/branch/main/graph/badge.svg?token=LGIyl3Ti4H)](https://codecov.io/gh/hoangvvo/next-connect)
[![minified size](https://badgen.net/bundlephobia/min/next-connect)](https://bundlephobia.com/result?p=next-connect)
[![download/year](https://badgen.net/npm/dy/next-connect)](https://www.npmjs.com/package/next-connect)

The promise-based method routing and middleware layer for [Next.js](https://nextjs.org/) [API Routes](#nextjs-api-routes), [Edge API Routes](#nextjs-edge-api-routes), [Middleware](#nextjs-middleware), [Next.js App Router](#nextjs-app-router), and [getServerSideProps](#nextjs-getserversideprops).

## Features

- Async middleware
- [Lightweight](https://bundlephobia.com/scan-results?packages=express,next-connect,koa,micro) => Suitable for serverless environment
- [way faster](https://github.com/hoangvvo/next-connect/tree/main/bench) than Express.js. Compatible with Express.js via [a wrapper](#expressjs-compatibility).
- Works with async handlers (with error catching)
- TypeScript support

## Installation

```sh
npm install next-connect@next
```

## Usage

Also check out the [examples](./examples/) folder.

### Next.js API Routes

`next-connect` can be used in [API Routes](https://nextjs.org/docs/api-routes/introduction).

```typescript
// pages/api/user/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter, expressWrapper } from "next-connect";
import cors from "cors";

const router = createRouter<NextApiRequest, NextApiResponse>();

router
  // Use express middleware in next-connect with expressWrapper function
  .use(expressWrapper(passport.session()))
  // A middleware example
  .use(async (req, res, next) => {
    const start = Date.now();
    await next(); // call next in chain
    const end = Date.now();
    console.log(`Request took ${end - start}ms`);
  })
  .get((req, res) => {
    const user = getUser(req.query.id);
    res.json({ user });
  })
  .put((req, res) => {
    if (req.user.id !== req.query.id) {
      throw new ForbiddenError("You can't update other user's profile");
    }
    const user = await updateUser(req.body.user);
    res.json({ user });
  });

export const config = {
  runtime: "edge",
};

export default router.handler({
  onError: (err, req, res) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).end(err.message);
  },
});
```

### Next.js Edge API Routes

`next-connect` can be used in [Edge API Routes](https://nextjs.org/docs/api-routes/edge-api-routes)

```typescript
// pages/api/user/[id].ts
import type { NextFetchEvent, NextRequest } from "next/server";
import { createEdgeRouter } from "next-connect";
import cors from "cors";

const router = createEdgeRouter<NextRequest, NextFetchEvent>();

router
  // A middleware example
  .use(async (req, event, next) => {
    const start = Date.now();
    await next(); // call next in chain
    const end = Date.now();
    console.log(`Request took ${end - start}ms`);
  })
  .get((req) => {
    const id = req.nextUrl.searchParams.get("id");
    const user = getUser(id);
    return NextResponse.json({ user });
  })
  .put((req) => {
    const id = req.nextUrl.searchParams.get("id");
    if (req.user.id !== id) {
      throw new ForbiddenError("You can't update other user's profile");
    }
    const user = await updateUser(req.body.user);
    return NextResponse.json({ user });
  });

export default router.handler({
  onError: (err, req, event) => {
    console.error(err.stack);
    return new NextResponse("Something broke!", {
      status: err.statusCode || 500,
    });
  },
});
```

### Next.js App Router

`next-connect` can be used in [Next.js 13 Route Handler](https://beta.nextjs.org/docs/routing/route-handlers). The way handlers are written is almost the same to [Next.js Edge API Routes](#nextjs-edge-api-routes) by using `createEdgeRouter`.

```typescript
// app/api/user/[id].ts

import type { NextFetchEvent, NextRequest } from "next/server";
import { createEdgeRouter } from "next-connect";
import cors from "cors";

interface RequestContext {
  params: {
    id: string;
  };
}

const router = createEdgeRouter<NextRequest, RequestContext>();

router
  // A middleware example
  .use(async (req, event, next) => {
    const start = Date.now();
    await next(); // call next in chain
    const end = Date.now();
    console.log(`Request took ${end - start}ms`);
  })
  .get((req) => {
    const id = req.params.id;
    const user = getUser(id);
    return NextResponse.json({ user });
  })
  .put((req) => {
    const id = req.params.id;
    if (req.user.id !== id) {
      throw new ForbiddenError("You can't update other user's profile");
    }
    const user = await updateUser(req.body.user);
    return NextResponse.json({ user });
  });

export async function GET(request: NextRequest, ctx: RequestContext) {
  return router.run(request, ctx);
}

export async function PUT(request: NextRequest, ctx: RequestContext) {
  return router.run(request, ctx);
}
```

### Next.js Middleware

`next-connect` can be used in [Next.js Middleware](https://nextjs.org/docs/advanced-features/middleware)

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";
import { createEdgeRouter } from "next-connect";

const router = createEdgeRouter<NextRequest, NextFetchEvent>();

router.use(async (request, event, next) => {
  // logging request example
  console.log(`${request.method} ${request.url}`);
  return next();
});

router.get("/about", (request) => {
  return NextResponse.redirect(new URL("/about-2", request.url));
});

router.use("/dashboard", (request) => {
  if (!isAuthenticated(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
});

router.all(() => {
  // default if none of the above matches
  return NextResponse.next();
});

export function middleware(request: NextRequest, event: NextFetchEvent) {
  return router.run(request, event);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

### Next.js getServerSideProps

`next-connect` can be used in [getServerSideProps](https://nextjs.org/docs/basic-features/data-fetching/get-server-side-props).

```jsx
// pages/users/[id].js
import { createRouter } from "next-connect";

export default function Page({ user, updated }) {
  return (
    <div>
      {updated && <p>User has been updated</p>}
      <div>{JSON.stringify(user)}</div>
      <form method="POST">{/* User update form */}</form>
    </div>
  );
}

const router = createRouter()
  .use(async (req, res, next) => {
    // this serve as the error handling middleware
    try {
      return await next();
    } catch (e) {
      return {
        props: { error: e.message },
      };
    }
  })
  .get(async (req, res) => {
    const user = await getUser(req.params.id);
    if (!user) {
      // https://nextjs.org/docs/api-reference/data-fetching/get-server-side-props#notfound
      return { props: { notFound: true } };
    }
    return { props: { user } };
  })
  .put(async (req, res) => {
    const user = await updateUser(req);
    return { props: { user, updated: true } };
  });

export async function getServerSideProps({ req, res }) {
  return router.run(req, res);
}
```

## API

The following APIs are rewritten in term of `NodeRouter` (`createRouter`), but they apply to `EdgeRouter` (`createEdgeRouter`) as well.

### router = createRouter()

Create an instance Node.js router.

### router.use(base, ...fn)

`base` (optional) - match all routes to the right of `base` or match all if omitted. (Note: If used in Next.js, this is often omitted)

`fn`(s) can either be:

- functions of `(req, res[, next])`
- **or** a router instance

```javascript
// Mount a middleware function
router1.use(async (req, res, next) => {
  req.hello = "world";
  await next(); // call to proceed to the next in chain
  console.log("request is done"); // call after all downstream handler has run
});

// Or include a base
router2.use("/foo", fn); // Only run in /foo/**

// mount an instance of router
const sub1 = createRouter().use(fn1, fn2);
const sub2 = createRouter().use("/dashboard", auth);
const sub3 = createRouter()
  .use("/waldo", subby)
  .get(getty)
  .post("/baz", posty)
  .put("/", putty);
router3
  // - fn1 and fn2 always run
  // - auth runs only on /dashboard
  .use(sub1, sub2)
  // `subby` runs on ANY /foo/waldo?/*
  // `getty` runs on GET /foo/*
  // `posty` runs on POST /foo/baz
  // `putty` runs on PUT /foo
  .use("/foo", sub3);
```

### router.METHOD(pattern, ...fns)

`METHOD` is an HTTP method (`GET`, `HEAD`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, `TRACE`) in lowercase.

`pattern` (optional) - match routes based on [supported pattern](https://github.com/lukeed/regexparam#regexparam-) or match any if omitted.

`fn`(s) are functions of `(req, res[, next])`.

```javascript
router.get("/api/user", (req, res, next) => {
  res.json(req.user);
});
router.post("/api/users", (req, res, next) => {
  res.end("User created");
});
router.put("/api/user/:id", (req, res, next) => {
  // https://nextjs.org/docs/routing/dynamic-routes
  res.end(`User ${req.params.id} updated`);
});

// Next.js already handles routing (including dynamic routes), we often
// omit `pattern` in `.METHOD`
router.get((req, res, next) => {
  res.end("This matches whatever route");
});
```

> **Note**
> You should understand Next.js [file-system based routing](https://nextjs.org/docs/routing/introduction). For example, having a `router.put("/api/foo", handler)` inside `page/api/index.js` _does not_ serve that handler at `/api/foo`.

### router.all(pattern, ...fns)

Same as [.METHOD](#methodpattern-fns) but accepts _any_ methods.

### router.handler(options)

Create a handler to handle incoming requests.

**options.onError**

Accepts a function as a catch-all error handler; executed whenever a handler throws an error.
By default, it responds with a generic `500 Internal Server Error` while logging the error to `console`.

```javascript
function onError(err, req, res) {
  logger.log(err);
  // OR: console.error(err);

  res.status(500).end("Internal server error");
}

export default router.handler({ onError });
```

**options.onNoMatch**

Accepts a function of `(req, res)` as a handler when no route is matched.
By default, it responds with a `404` status and a `Route [Method] [Url] not found` body.

```javascript
function onNoMatch(req, res) {
  res.status(404).end("page is not found... or is it!?");
}

export default router.handler({ onNoMatch });
```

### router.run(req, res)

Runs `req` and `res` through the middleware chain and returns a **promise**. It resolves with the value returned from handlers.

```js
router
  .use(async (req, res, next) => {
    return (await next()) + 1;
  })
  .use(async () => {
    return (await next()) + 2;
  })
  .use(async () => {
    return 3;
  });

console.log(await router.run(req, res));
// The above will print "6"
```

If an error in thrown within the chain, `router.run` will reject. You can also add a try-catch in the first middleware to catch the error before it rejects the `.run()` call:

```js
router
  .use(async (req, res, next) => {
    return next().catch(errorHandler);
  })
  .use(thisMiddlewareMightThrow);

await router.run(req, res);
```

## Common errors

There are some pitfalls in using `next-connect`. Below are things to keep in mind to use it correctly.

1. **Always** `await next()`

If `next()` is not awaited, errors will not be caught if they are thrown in async handlers, leading to `UnhandledPromiseRejection`.

```javascript
// OK: we don't use async so no need to await
router
  .use((req, res, next) => {
    next();
  })
  .use((req, res, next) => {
    next();
  })
  .use(() => {
    throw new Error("💥");
  });

// BAD: This will lead to UnhandledPromiseRejection
router
  .use(async (req, res, next) => {
    next();
  })
  .use(async (req, res, next) => {
    next();
  })
  .use(async () => {
    throw new Error("💥");
  });

// GOOD
router
  .use(async (req, res, next) => {
    await next(); // next() is awaited, so errors are caught properly
  })
  .use((req, res, next) => {
    return next(); // this works as well since we forward the rejected promise
  })
  .use(async () => {
    throw new Error("💥");
    // return new Promise.reject("💥");
  });
```

Another issue is that the handler would resolve before all the code in each layer runs.

```javascript
const handler = router
  .use(async (req, res, next) => {
    next(); // this is not returned or await
  })
  .get(async () => {
    // simulate a long task
    await new Promise((resolve) => setTimeout(resolve, 1000));
    res.send("ok");
    console.log("request is completed");
  })
  .handler();

await handler(req, res);
console.log("finally"); // this will run before the get layer gets to finish

// This will result in:
// 1) "finally"
// 2) "request is completed"
```

2. **DO NOT** reuse the same instance of `router` like the below pattern:

```javascript
// api-libs/base.js
export default createRouter().use(a).use(b);

// api/foo.js
import router from "api-libs/base";
export default router.get(x).handler();

// api/bar.js
import router from "api-libs/base";
export default router.get(y).handler();
```

This is because, in each API Route, the same router instance is mutated, leading to undefined behaviors.
If you want to achieve something like that, you can use `router.clone` to return different instances with the same routes populated.

```javascript
// api-libs/base.js
export default createRouter().use(a).use(b);

// api/foo.js
import router from "api-libs/base";
export default router.clone().get(x).handler();

// api/bar.js
import router from "api-libs/base";
export default router.clone().get(y).handler();
```

3. **DO NOT** use response function like `res.(s)end` or `res.redirect` inside `getServerSideProps`.

```javascript
// page/index.js
const handler = createRouter()
  .use((req, res) => {
    // BAD: res.redirect is not a function (not defined in `getServerSideProps`)
    // See https://github.com/hoangvvo/next-connect/issues/194#issuecomment-1172961741 for a solution
    res.redirect("foo");
  })
  .use((req, res) => {
    // BAD: `getServerSideProps` gives undefined behavior if we try to send a response
    res.end("bar");
  });

export async function getServerSideProps({ req, res }) {
  await router.run(req, res);
  return {
    props: {},
  };
}
```

3. **DO NOT** use `handler()` directly in `getServerSideProps`.

```javascript
// page/index.js
const router = createRouter().use(foo).use(bar);
const handler = router.handler();

export async function getServerSideProps({ req, res }) {
  await handler(req, res); // BAD: You should call router.run(req, res);
  return {
    props: {},
  };
}
```

## Contributing

Please see my [contributing.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
