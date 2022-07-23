# next-connect

[![npm](https://badgen.net/npm/v/next-connect)](https://www.npmjs.com/package/next-connect)
[![CircleCI](https://circleci.com/gh/hoangvvo/next-connect.svg?style=svg)](https://circleci.com/gh/hoangvvo/next-connect)
[![codecov](https://codecov.io/gh/hoangvvo/next-connect/branch/main/graph/badge.svg?token=LGIyl3Ti4H)](https://codecov.io/gh/hoangvvo/next-connect)
[![minified size](https://badgen.net/bundlephobia/min/next-connect)](https://bundlephobia.com/result?p=next-connect)
[![download/year](https://badgen.net/npm/dy/next-connect)](https://www.npmjs.com/package/next-connect)

The promise-based method routing and middleware layer for [Next.js](https://nextjs.org/) (API Routes, Edge API Routes, getServerSideProps, Middleware) and many other frameworks.

> **Warning**
> v1 is a complete rewrite of v0 and is **not** backward-compatible. See [Releases](https://github.com/hoangvvo/next-connect/releases) to learn about the changes.

> [v0](https://github.com/hoangvvo/next-connect/tree/v0), which is written to be compatible with Express.js middleware, is still maintained with bug fixes. v1 drops explicit support for Express.js middleware, but still provide a way to use them through a wrapper (see below)

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

> **Note**
>
> Although `next-connect` is initially written for Next.js, it can be used in [http server](https://nodejs.org/api/http.html#httpcreateserveroptions-requestlistener), [Vercel](https://vercel.com/docs/concepts/functions/serverless-functions). See [Examples](./examples/) for more integrations.

Below are some use cases.

### Next.js API Routes

```typescript
// pages/api/hello.js
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter, expressWrapper } from "next-connect";
import cors from "cors";

// Default Req and Res are IncomingMessage and ServerResponse
// You may want to pass in NextApiRequest and NextApiResponse
const router = createRouter<NextApiRequest, NextApiResponse>();

router
  .use(expressWrapper(cors())) // express middleware are supported if you wrap it with expressWrapper
  .use(async (req, res, next) => {
    const start = Date.now();
    await next(); // call next in chain
    const end = Date.now();
    console.log(`Request took ${end - start}ms`);
  })
  .get((req, res) => {
    res.send("Hello world");
  })
  .post(async (req, res) => {
    // use async/await
    const user = await insertUser(req.body.user);
    res.json({ user });
  })
  .put(
    async (req, res, next) => {
      // You may want to pass in NextApiRequest & { isLoggedIn: true }
      // in createRouter generics to define this extra property
      if (!req.isLoggedIn) throw new Error("thrown stuff will be caught");
      // go to the next in chain
      return next();
    },
    async (req, res) => {
      const user = await updateUser(req.body.user);
      res.json({ user });
    }
  );

// create a handler from router with custom
// onError and onNoMatch
export default router.handler({
  onError: (err, req, res) => {
    console.error(err.stack);
    res.status(500).end("Something broke!");
  },
  onNoMatch: (req, res) => {
    res.status(404).end("Page is not found");
  },
});
```

### Next.js getServerSideProps

```jsx
// page/users/[id].js
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
  .use(async (req, res, next) => {
    logRequest(req);
    return next();
  })
  .get(async (req, res) => {
    const user = await getUser(req.params.id);
    if (!user) {
      // https://nextjs.org/docs/api-reference/data-fetching/get-server-side-props#notfound
      return { props: { notFound: true } };
    }
    return { props: { user } };
  })
  .post(async (req, res) => {
    const user = await updateUser(req);
    return { props: { user, updated: true } };
  });

export async function getServerSideProps({ req, res }) {
  return router.run(req, res);
}
```

### Next.js Edge API Routes (Beta)

Edge Router can be used in [Edge Runtime](https://nextjs.org/docs/api-reference/edge-runtime)

```ts
import type { NextFetchEvent, NextRequest } from "next/server";
import { createEdgeRouter } from "next-connect";
import cors from "cors";

// Default Req and Evt are Request and unknown
// You may want to pass in NextRequest and NextFetchEvent
const router = createEdgeRouter<NextRequest, NextFetchEvent>();

router
  .use(expressWrapper(cors())) // express middleware are supported if you wrap it with expressWrapper
  .use(async (req, evt, next) => {
    const start = Date.now();
    await next(); // call next in chain
    const end = Date.now();
    console.log(`Request took ${end - start}ms`);
  })
  .get((req, res) => {
    return new Response("Hello world");
  })
  .post(async (req, res) => {
    // use async/await
    const user = await insertUser(req.body.user);
    res.json({ user });
    return new Response(JSON.stringify({ user }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
  })
  .put(async (req, res) => {
    const user = await updateUser(req.body.user);
    return new Response(JSON.stringify({ user }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
  });

// create a handler from router with custom
// onError and onNoMatch
export default router.handler({
  onError: (err, req, evt) => {
    console.error(err.stack);
    return new NextResponse("Something broke!", {
      status: 500,
    });
  },
  onNoMatch: (req, res) => {
    return new NextResponse("Page is not found", {
      status: 404,
    });
  },
});
```

### Next.js Middleware

Edge Router can be used in [Next.js Middleware](https://nextjs.org/docs/advanced-features/middleware)

```ts
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";
import { createEdgeRouter } from "next-connect";

// This function can be marked `async` if using `await` inside

const router = createEdgeRouter<NextRequest, NextFetchEvent>();

router.use(async (request, _, next) => {
  await logRequest(request);
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

router.all((request) => {
  // default if none of the above matches
  return NextResponse.next();
});

export function middleware(request: NextRequest) {
  return NextResponse.redirect(new URL("/about-2", request.url));
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

## Recipes

### Next.js

<details>
<summary>Match multiple routes</summary>

If you created the file `/api/<specific route>.js` folder, the handler will only run on that specific route.

If you need to create all handlers for all routes in one file (similar to `Express.js`). You can use [Optional catch-all API routes](https://nextjs.org/docs/api-routes/dynamic-api-routes#optional-catch-all-api-routes).

```javascript
// pages/api/[[...slug]].js
import { createRouter } from "next-connect";

const router = createRouter()
  .use("/api/hello", someMiddleware())
  .get("/api/user/:userId", (req, res) => {
    res.send(`Hello ${req.params.userId}`);
  });

export default router.handler();
```

While this allows quick migration from Express.js, consider seperating routes into different files (`/api/user/[userId].js`, `/api/hello.js`) in the future.

</details>

### Express.js Compatibility

<details>
<summary>Middleware wrapper</summary>

Express middleware is not built around promises but callbacks. This prevents it from playing well in the `next-connect` model. Understanding the way express middleware works, we can build a wrapper like the below:

```js
import { expressWrapper } from "next-connect";
import someExpressMiddleware from "some-express-middleware";

router.use(expressWrapper(someExpressMiddleware));
```

</details>

## Contributing

Please see my [contributing.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
