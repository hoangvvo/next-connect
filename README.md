# next-connect

[![npm](https://badgen.net/npm/v/next-connect)](https://www.npmjs.com/package/next-connect)
[![minified size](https://badgen.net/bundlephobia/min/next-connect)](https://bundlephobia.com/result?p=next-connect)
[![CircleCI](https://circleci.com/gh/hoangvvo/next-connect.svg?style=svg)](https://circleci.com/gh/hoangvvo/next-connect)
[![codecov](https://codecov.io/gh/hoangvvo/next-connect/branch/master/graph/badge.svg)](https://codecov.io/gh/hoangvvo/next-connect)
[![PRs Welcome](https://badgen.net/badge/PRs/welcome/ff5252)](CONTRIBUTING.md)

The method routing and middleware layer for [Next.js](https://nextjs.org/).

## Installation

```sh
npm install next-connect
// or
yarn add next-connect
```

## Usage

The usage is similar to [Express.js](https://github.com/expressjs/express/) but without `path` as the first argument.

In [API Routes](https://github.com/zeit/next.js/#api-routes), when doing `export default`, use `handler`.

```javascript
import nextConnect from 'next-connect';

const handler = nextConnect();

//  use middleware
handler.use(someMiddleware());

//  response to GET
handler.get(function (req, res) {
    res.send('Hello world');
});

//  response to POST
handler.post(function (req, res) {
    res.json('Hi there');
});

//  export using handler
export default handler;
```

### Use middleware

Middleware is the core of `next-connect`. Middlewares are added as layers of a "stack" where the request and response will be routed through each layer one-by-one as long as `next()` is called.

`handler.use(fn[, fn ...])`

`fn`(s) are functions of `(req, res[, next])`.

```javascript
handler.use(function (req, res, next) {
    //  Do some stuff with req and res here
    req.user = getUser(req);
    //  Call next() to proceed to the next middleware in the chain
    next();
})

handler.use(function (req, res) {
    if (req.user) res.end(`The user is ${req.user.name}`);
    else res.end('There is no user');
    //  next() is not called, the chain is terminated.
})

//  You can use a library too.
handler.use(passport.initialize());

//  You can chain them too
handler.use(thisMiddleware, thatMiddleware);
```

#### Error middleware

Error middlewares will be called when an error is thrown. They should be placed at the end.

`Middlewares` that are not error handler will be skipped over. It is not neccessary for the former middleware to call `next()`. Calling `next(new Error())` will also trigger error middleware.

Error middleware is similar to regular middleware except an additional `err` as the first argument.

```javascript
handler.get(function (req, res) {
    throw new Error('Oh no!');
})

handler.use(function (err, req, res, next) {
    console.error(err);
    res.status(500).end('Internal Server Error');
    //  Pass along the error to another error handler
    next(err);
})
handler.use(function (err, req, res, next) {
    logger.log(err);
})
```

Notice that an error middleware **must** have four arguments. In case you do not want to have the `next` argument, use `handler.error(fn[, fn ...])` instead.

```javascript
//  This is still considered an error middleware
handler.error(function (err, res, res) {
    console.error(err);
})
```

#### Reuse middleware

An instance of `NextConnect` may be reused.

```javascript
//  middleware/commonMiddleware.js
import nextConnect from 'next-connect'

const middleware = nextConnect();

middleware.use(authMiddleware());
middleware.use(corsMiddleware());
middleware.use(boringMiddleware());

export default middleware;
```

After exporting the instance of nextConnect, import it everywhere you need to reuse.

```javascript
//  api/boring.js
import commonMiddleware from '../middleware/commonMiddleware';

const handler = nextConnect();
//  reuse the instance
handler.use(commonMiddleware);

//  extend the reused middleware
handler.use(evenMoreBoringMiddleware());
handler.post(responseToBoringPostRequest());
```

### Method routing

`handler.METHOD(fn[, fn ...])`

Response to the HTTP request based on `METHOD`, where `METHOD` is the HTTP method (`GET`, `POST`, `PUT`, etc.) in lowercase. (ex. `handler.post`, `handler.put`, ...)

`fn` is a function of `(req, res[, next])`.

```javascript
//  api/publicRoute.js
handler.post(function (req, res) {
    res.send('A public route');
})
```

The function can also accept more than one argument (function), in which case it will act as a series of middleware.

```javascript
//  api/privateRoute.js
function isAuth(req, res, next) {
    if (!req.user) res.status(401).end('You need to be authenticated');
    else next();
}
handler.post(isAuth, function (req, res) {
    res.json(req.user);
})
```

### 404

If no response is sent, `next-connect` will return 404.

```javascript
//  api/somePostRoute
handler.post(function (req, res) {
    res.send('POST')
});

export default handler;

//  Navigating to /api/somePostRoute in the browser will render 404.
```

### Document middleware and getInitialProps

To use `next-connect` in [document middleware](https://github.com/zeit/next.js/issues/7208) or `getInitialProps`, use (`await`) `handler.apply(req, res)` instead.

```javascript
// page/_document.js
export async function middleware({req, res}: PageContext) {
    const handler = nextConnect();
    handler.use(someMiddleware());
    // await calling .apply
    await handler.apply(req, res);
}

// OR
// page/somePage.js
Page.getInitialProps = async ({ req, res }) => {
  const handler = nextConnect();
  handler.use(someMiddleware());
  await handler.apply(req, res);
  return { ...whatEverYourLittleDesires }
}
```

[404](#404) automatic response will not be triggered in `.apply()`

## Contributing

Please see my [contributing.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
