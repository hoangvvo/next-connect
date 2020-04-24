# next-connect

[![npm](https://badgen.net/npm/v/next-connect)](https://www.npmjs.com/package/next-connect)
[![install size](https://packagephobia.now.sh/badge?p=next-connect)](https://packagephobia.now.sh/result?p=next-connect)
[![CircleCI](https://circleci.com/gh/hoangvvo/next-connect.svg?style=svg)](https://circleci.com/gh/hoangvvo/next-connect)
[![codecov](https://codecov.io/gh/hoangvvo/next-connect/branch/master/graph/badge.svg)](https://codecov.io/gh/hoangvvo/next-connect)
[![PRs Welcome](https://badgen.net/badge/PRs/welcome/ff5252)](CONTRIBUTING.md)

The method routing and middleware layer for [Next.js](https://nextjs.org/) (also works in [micro](https://github.com/zeit/micro) or [Node.js HTTP Server](https://nodejs.org/api/http.html)). Powered by [trouter](https://github.com/lukeed/trouter).

## Installation

```sh
npm install next-connect
// or
yarn add next-connect
```

## Usage

`next-connect` is often used in [API Routes](https://nextjs.org/docs/api-routes/introduction):

```javascript
// pages/api/index.js
import nextConnect from "next-connect";

const handler = nextConnect();

handler
  .use(someMiddleware())
  .get((req, res) => {
    res.send("Hello world");
  })
  .post((req, res) => {
    res.json({ hello: 'world' });
  })
  .put(async (req, res) => {
    res.end('async/await is also supported!');
  });

export default handler;
```

For usage in pages with [`getServerSideProps`](https://nextjs.org/docs/basic-features/data-fetching#getserversideprops-server-side-rendering), see [`.apply`](#applyreq-res).

See an example in [nextjs-mongodb-app](https://github.com/hoangvvo/nextjs-mongodb-app) (CRUD, Authentication with Passport, and more)

## API

The API is similar to [Express.js](https://github.com/expressjs/express) with several differences.

### nextConnect(options)

Initialize an instance of `next-connect`.

#### options.onError

Accepts a function as a catch-all error handler; executed whenever a middleware throws an error.
By default, it responses with status code `500` and error message if any.

```javascript
function onError(err, req, res, next) {
  logger.log(err);

  res.status(500).end(err.toString());
  // OR: you may want to continue
  next()
}

const handler = nextConnect({ onError });

handler
  .use((req, res, next) => {
    throw new Error('oh no!');
    // or use next
    next(Error('oh no'));
  })
  .use((req, res) => {
    // this will run if next() is called in onError
    res.end('error no more');
  });
```

#### options.onNoMatch

Accepts a function of `(req, res)` as a handler when no route is matched.
By default, it responses with `404` status and `not found` body.

```javascript
function onNoMatch(req, res) {
  res.status(404).end('page is not found... or is it')
}

const handler = nextConnect({ onNoMatch });
```

### .use(base, ...fn)

`base` (optional) - match all route to the right of `base` or match all if omitted.
`fn`(s) are functions of `(req, res[, next])` **or** an instance of `next-connect`, where it will act as a sub application.

```javascript
handler.use((req, res, next) => {
  req.hello = 'world';
  // call next if you want to proceed to next in chain
  next();
});

// Reuse an instance of nextConnect
const anotherHandler = nextConnect()
anotherHandler.use(commonFn).use(anotherFn);
handler.use(anotherHandler);

// You can use a library too.
handler.use(passport.initialize());
```

### .METHOD(pattern, ...fns)

`METHOD` is a HTTP method (`GET`, `HEAD`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, `TRACE`) in lowercase.
`pattern` (optional) - match all route based on [supported](https://github.com/lukeed/trouter#pattern) pattern or match all if omitted.
`fn`(s) are functions of `(req, res[, next])`. This is ideal to be used in API Routes.

```javascript
handler.use('/user', passport.initialize());
handler.get('/user', (req, res, next) => {
  res.json(req.user);
});
handler.post('/users', (req, res, next) => {
  res.end('User created');
});
handler.put('/user/:id', (req, res, next) => {
  // https://nextjs.org/docs/routing/dynamic-routes
  res.end(`User ${req.query.id} updated`);
});
handler.get((req, res, next) => {
  res.end('This matchs whatever route')
})
```

However, since Next.js already handles routing (including dynamic routes), we often omit `pattern` in `.METHOD`.

### .apply(req, res)

Applies the middleware and returns a **promise** after which you can use the upgraded `req` and `res`.

This can be useful in [`getServerSideProps`](https://nextjs.org/docs/basic-features/data-fetching#getserversideprops-server-side-rendering).

```javascript
// page/index.js
export async function getServerSideProps({ req, res }) {
  const handler = nextConnect();
  handler.use(passport.initialize());
  try {
    await handler.apply(req, res);
  } catch(e) {
    // handle the error
  }
  // do something with the upgraded req and res
  return {
    props: { user: req.user }, // will be passed to the page component as props
  }
};
```

## Using in other frameworks

`next-connect` supports any frameworks that has the signature of `(req, res)`.

### [Micro](https://github.com/zeit/micro)

```javascript
const {send} = require('micro')
const handler = require('next-connect')()

handler
  .use(someMiddleware())
  .get(() => 'hello world')
  .post((req, res) => {
    send(res, 200, { hello: 'world' })
  });

module.exports = handler;
```

### Node.js HTTP Server

```javascript
const handler = require('next-connect')()
const http = require('http');

handler
  .use(someMiddleware())
  .get((req, res) => {
    res.end('Hello world');
  })
  .post((req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ hello: 'world' }));
  });

http.createServer(handler).listen(PORT);
```

## Contributing

Please see my [contributing.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
