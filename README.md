# next-connect

[![npm](https://badgen.net/npm/v/next-connect)](https://www.npmjs.com/package/next-connect)
[![CircleCI](https://circleci.com/gh/hoangvvo/next-connect.svg?style=svg)](https://circleci.com/gh/hoangvvo/next-connect)
[![codecov](https://codecov.io/gh/hoangvvo/next-connect/branch/master/graph/badge.svg)](https://codecov.io/gh/hoangvvo/next-connect)
[![minified size](https://badgen.net/bundlephobia/min/next-connect)](https://bundlephobia.com/result?p=next-connect)
[![download/year](https://badgen.net/npm/dy/next-connect)](https://www.npmjs.com/package/next-connect)
[![PRs Welcome](https://badgen.net/badge/PRs/welcome/ff5252)](CONTRIBUTING.md)

The smol method routing and middleware for [Next.js](https://nextjs.org/) (also works in [other frameworks](#using-in-other-frameworks)). Powered by [trouter](https://github.com/lukeed/trouter).

## Features

- Compatible with Express.js middleware and router => Drop-in replacement for Express.js.
- Lightweight (~ 3KB) => Suitable for serverless environment.
- 5x faster than Express.js with no overhead
- Works with async handlers (with error catching)
- TypeScript support

## Installation

```sh
npm install next-connect
// or
yarn add next-connect
```

## Usage

`next-connect` is often used in [API Routes](https://nextjs.org/docs/api-routes/introduction):

```javascript
// pages/api/hello.js
import nc from "next-connect";

const handler = nc({
  onError: (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).end("Something broke!");
  },
  onNoMatch: (req, res) => {
    res.status(404).end("Page is not found");
  },
})
  .use(someMiddleware())
  .get((req, res) => {
    res.send("Hello world");
  })
  .post((req, res) => {
    res.json({ hello: "world" });
  })
  .put(async (req, res) => {
    res.end("async/await is also supported!");
  })
  .patch(async (req, res) => {
    throw new Error("Throws me around! Error can be caught and handled.");
  });

export default handler;
```

**NOTE:** Make sure the response is sent or `handler()` will never resolve (unless `options.disableResponseWait` is `true`).

For quick migration from [Custom Express server](https://nextjs.org/docs/advanced-features/custom-server), simply replacing `express()` _and_ `express.Router()` with `nc()` and follow the [match multiple routes recipe](#catch-all).

For usage in pages with [`getServerSideProps`](https://nextjs.org/docs/basic-features/data-fetching#getserversideprops-server-side-rendering), see [`.run`](#runreq-res).

See an example in [nextjs-mongodb-app](https://github.com/hoangvvo/nextjs-mongodb-app) (CRUD, Authentication with Passport, and more)

### TypeScript

By default, the base interfaces of `req` and `res` are `IncomingMessage` and `ServerResponse`. When using in API Routes, you would set them to `NextApiRequest` and `NextApiResponse` by providing the generics to the factory function like so:

```typescript
import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";

const handler = nc<NextApiRequest, NextApiResponse>();
```

In each handler, you can also define custom properties to `req` and `res` (such as `req.user` or `res.cookie`) like so:

```typescript
interface ExtendedRequest {
  user: string;
}
interface ExtendedResponse {
  cookie(name: string, value: string): void;
}

handler.post<ExtendedRequest, ExtendedResponse>((req, res) => {
  req.user = "Anakin";
  res.cookie("sid", "8108");
});
```

## API

The API is similar to [Express.js](https://github.com/expressjs/express) with several differences:

- It does not include any [helper methods](http://expressjs.com/en/4x/api.html#res.append) or template engine (you can incorporate them using middleware).
- It does not support error-handling middleware pattern. Use `options.onError` instead.

It is more like good ol' [connect](https://www.npmjs.com/package/connect) (hence the name) with method routing.

### handler = nc(options?)

Initialize an instance of `next-connect`.

#### options.onError

**Important:** It is strongly recommended to set this option, since the default does not report the error to the terminal.

Accepts a function as a catch-all error handler; executed whenever a middleware throws an error.
By default, it responds with status code `500` and an error message if any.

```javascript
function onError(err, req, res, next) {
  logger.log(err);
  // OR: console.error(err);

  res.status(500).end(err.toString());
  // OR: you may want to continue
  next();
}

const handler = nc({ onError });

handler
  .use((req, res, next) => {
    throw new Error("oh no!");
    // or use next
    next(Error("oh no"));
  })
  .use((req, res) => {
    // this will run if next() is called in onError
    res.end("error no more");
  });
```

**Note:** This option is ignored if `handler` is used as a sub app or when `handler.run()` is used.

#### options.onNoMatch

Accepts a function of `(req, res)` as a handler when no route is matched.
By default, it responds with `404` status and `not found` body.

```javascript
function onNoMatch(req, res) {
  res.status(404).end("page is not found... or is it");
}

const handler = nc({ onNoMatch });
```

**Note:** This option is ignored if `handler` is used as a sub app or when `handler.run()` is used.

#### options.attachParams

Passing `true` will attach `params` object to `req`. By default, it does not set to `req.params`.

```javascript
const handler = nc({ attachParams: true });

handler.get("/users/:userId/posts/:postId", (req, res) => {
  // Visiting '/users/12/posts/23' will render '{"userId":"12","postId":"23"}'
  res.send(req.params);
});
```

### options.disableResponseWait

Passing `true` will disable waiting for the response to end (that is, after `res.end()` is called) before resolving the `handler(req, res)` promise.

```js
await handler(req, res);
// will not reach here unless res.end() has been called or options.disableResponseWait is true.
```

**Note:** This option is ignored if `handler` is used as a sub app or when `handler.run()` is used.

### handler.use(base, ...fn)

`base` (optional) - match all route to the right of `base` or match all if omitted. (Note: If used in Next.js, this is often omitted)

`fn`(s) can either be:

- functions of `(req, res[, next])`
- **or** an instance of `next-connect`, where it will act as a sub application. `onError` and `onNoMatch` of that subapp are disregarded.

```javascript
// Mount a middleware function
handler.use((req, res, next) => {
  req.hello = "world";
  next(); // call to proceed to next in chain
});

// Or include a base
handler.use("/foo", fn); // Only run in /foo/**

// Mount an instance of next-connect
const common = nc().use(midd1).use("/", midd2); // good for common middlewares
const auth = nc().use("/dashboard", checkAuth);
const subapp = nc().get(getHandle).post("/baz", postHandle).put("/", putHandle);
handler
  // `midd1` and `midd2` runs everywhere
  .use(common)
  // `checkAuth` only runs on /dashboard/*
  .use(auth)
  // `getHandle` runs on /foo/*
  // `postHandle` runs on /foo/baz
  // `putHandle` runs on /foo
  .use("/foo", subapp);

// You can use a library too.
handler.use(passport.initialize());
```

### handler.METHOD(pattern, ...fns)

`METHOD` is a HTTP method (`GET`, `HEAD`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, `TRACE`) in lowercase.

`pattern` (optional) - match all route based on [supported](https://github.com/lukeed/trouter#pattern) pattern or match all if omitted.

`fn`(s) are functions of `(req, res[, next])`. This is ideal to be used in API Routes.

```javascript
handler.get("/api/user", (req, res, next) => {
  res.json(req.user);
});
handler.post("/api/users", (req, res, next) => {
  res.end("User created");
});
handler.put("/api/user/:id", (req, res, next) => {
  // https://nextjs.org/docs/routing/dynamic-routes
  res.end(`User ${req.query.id} updated`);
});
handler.get((req, res, next) => {
  res.end("This matches whatever route");
});
```

However, since Next.js already handles routing (including dynamic routes), we often omit `pattern` in `.METHOD`.

**Note:** You should understand Next.js [file-system based routing](https://nextjs.org/docs/routing/introduction). For example, having a `handler.put("/api/foo", handler)` inside `page/api/index.js` _does not_ serve that handler at `/api/foo`.

### handler.all(pattern, ...fns)

Same as [.METHOD](#methodpattern-fns) but accepts _any_ methods.

### handler.run(req, res)

Runs `req` and `res` the middleware and returns a **promise**. It will **not** render `404` on not found or `onError` on error.

**Note:** You _MUST_ call `next()` in the final handler for the promise to resolve.

This can be useful in [`getServerSideProps`](https://nextjs.org/docs/basic-features/data-fetching#getserversideprops-server-side-rendering).

```javascript
// page/index.js
export async function getServerSideProps({ req, res }) {
  const handler = nc()
    .use(passport.initialize())
    .post(async (req, res, next) => {
      await logPostRequest(req);
      next(); // <- make sure next() is called
    });
  try {
    await handler.run(req, res);
  } catch (e) {
    // handle the error
  }
  // do something with the upgraded req and res
  return {
    props: { user: req.user },
  };
}
```

## Common errors

1. **DO NOT** reuse the same instance of `nc` like the below pattern:

```js
// middleware/common
export default nc().use(a).use(b);

// api/foo
import Handler from "middleware/common";
export default Handler.get(x);

// api/bar
import Handler from "middleware/common";
export default Handler.get(y);
```

This is because in each API Route, the same NextConnect instance is mutated, leading to undefined behaviors.
If you want to achieve the something like that, try rewriting the base instance as a factory function to avoid reusing the same instance:

```js
// middleware/common
export default function base() {
  return nc().use(a).use(b);
}

// api/foo
import base from "middleware/common";
export default base().get(x);

// api/bar
import base from "middleware/common";
export default base().get(y);
```

2. **DO NOT** use response function like `res.(s)end` or `res.redirect` inside `getServerSideProps`.

```js
// page/index.js
const handler = nc()
  .use((req, res) => {
    // BAD: res.redirect is not a function (not defined in `getServerSideProps`
    res.redirect("foo");
  })
  .use((req, res) => {
    // BAD: `getServerSideProps` gives undefined behavior if we try to send response
    res.end("bar");
  });

export async function getServerSideProps({ req, res }) {
  await handler.run(req, res);
  return {
    props: {},
  };
}
```

3. **DO NOT** use `handler(req, res)` directly in `getServerSideProps`.

```js
// page/index.js
const handler = nc().use(foo).use(bar);

export async function getServerSideProps({ req, res }) {
  await handler(req, res); // BAD: You must you handler.run(req, res);
  return {
    props: {},
  };
}
```

## Recipes

### Next.js

<details id="catch-all">
<summary>Match multiple routes</summary>

If you created the file `/api/<specific route>.js` folder, the handler will only run on that specific route.

If you need to create all handlers for all routes in one file (similar to `Express.js`). You can use [Optional catch all API routes](https://nextjs.org/docs/api-routes/dynamic-api-routes#optional-catch-all-api-routes).

```js
// pages/api/[[...slug]].js
import nc from "next-connect";

const handler = nc({ attachParams: true })
  .use("/api/hello", someMiddleware())
  .get("/api/user/:userId", (req, res) => {
    res.send(`Hello ${req.params.userId}`);
  });

export default handler;
```

While this allows quick migration from Express.js, consider seperating routes into different files (`/api/user/[userId].js`, `/api/hello.js`) in the future.

</details>

### Using in other frameworks

`next-connect` supports any frameworks and runtimes that support `(req, res) => void` handler.

<details>
<summary><a href="https://github.com/zeit/micro">Micro</a></summary>

```javascript
const { send } = require("micro");
const nc = require("next-connect");

module.exports = nc()
  .use(middleware)
  .get((req, res) => {
    res.end("Hello World!");
  })
  .post((req, res) => {
    send(res, 200, { hello: "world" });
  });
```

</details>

<details>
<summary><a href="https://vercel.com/docs/serverless-functions/introduction">Vercel</a></summary>

```javascript
const nc = require("next-connect");

module.exports = nc()
  .use(middleware)
  .get((req, res) => {
    res.send("Hello World!");
  })
  .post((req, res) => {
    res.json({ hello: "world" });
  });
```

</details>

<details>
<summary>Node.js <a href="https://nodejs.org/api/http.html">HTTP</a> / <a href="https://nodejs.org/api/http2.html">HTTP2</a> Server</summary>

```javascript
const http = require("http");
// const http2 = require('http2');
const nc = require("next-connect");

const handler = nc()
  .use(middleware)
  .get((req, res) => {
    res.end("Hello world");
  })
  .post((req, res) => {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ hello: "world" }));
  });

http.createServer(handler).listen(PORT);
// http2.createServer(handler).listen(PORT);
```

</details>

## Contributing

Please see my [contributing.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
