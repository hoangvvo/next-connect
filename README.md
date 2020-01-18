# next-connect

[![npm](https://badgen.net/npm/v/next-connect)](https://www.npmjs.com/package/next-connect)
[![install size](https://packagephobia.now.sh/badge?p=next-connect)](https://packagephobia.now.sh/result?p=next-connect)
[![CircleCI](https://circleci.com/gh/hoangvvo/next-connect.svg?style=svg)](https://circleci.com/gh/hoangvvo/next-connect)
[![codecov](https://codecov.io/gh/hoangvvo/next-connect/branch/master/graph/badge.svg)](https://codecov.io/gh/hoangvvo/next-connect)
[![PRs Welcome](https://badgen.net/badge/PRs/welcome/ff5252)](CONTRIBUTING.md)

The method routing and middleware layer for [Next.js](https://nextjs.org/). Powered by [trouter](https://github.com/lukeed/trouter).

## Installation

```sh
npm install next-connect
// or
yarn add next-connect
```

## Usage

```javascript
import nextConnect from "next-connect";

const handler = nextConnect();

handler
  .use(someMiddleware())
  .get((req, res) => {
    res.send("Hello world");
  })
  .post((req, res) => {
    res.json("Hi there");
  });

export default handler;
```

## API

The API is similar to [Express.js](https://github.com/expressjs/express) with a few additions.

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

### use(base, ...fn)

`base` (optional) - match all route to the right of `base`.
`fn`(s) are functions of `(req, res[, next])`

`fn` can also be an instance of `next-connect`, where it will act as a sub application.

```javascript
handler.use((req, res, next) => {
  req.hello = 'world';
  // call next if you want to proceed to next chain
  next();
});

// Reuse an instance of nextConnect
const anotherHandler = nextConnect().use(thisFn).use(thatFn);
handler.use(anotherHandler);

// You can use a library too.
handler.use(passport.initialize());
```

#### Error middleware

**Deprecated: Use `options.onError` instead.**

### METHOD(pattern, ...fns)

`pattern` (optional) - match all route based on [supported](https://github.com/lukeed/trouter#pattern) pattern or match all if not provided.
`fn`(s) are functions of `(req, res[, next])`.

```javascript
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
```

### .apply(req, res)

This is used in [document middleware](https://github.com/zeit/next.js/issues/7208) or `getInitialProps`. It returns a promise after which you can use the upgraded `req` and `res`. The last middleware must call `next()`.

```javascript
// page/_document.js
export async function middleware({ req, res }: PageContext) {
  await handler.apply(req, res);
}
// OR
// page/somePage.js
Page.getInitialProps = async ({ req, res }) => {
  await handler.apply(req, res);
  return { ...whatEverYourLittleDesires };
};
```

## Contributing

Please see my [contributing.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
