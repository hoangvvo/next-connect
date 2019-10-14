# next-connect

![npm](https://badgen.net/npm/v/next-connect)
[![CircleCI](https://circleci.com/gh/hoangvvo/next-connect.svg?style=svg)](https://circleci.com/gh/hoangvvo/next-connect)
[![codecov](https://codecov.io/gh/hoangvvo/next-connect/branch/master/graph/badge.svg)](https://codecov.io/gh/hoangvvo/next-connect)
[![PRs Welcome](https://badgen.net/badge/PRs/welcome/ff5252)](CONTRIBUTING.md)

The method routing and middleware layer for [Next.js](https://nextjs.org/) API Routes.

## Installation

```sh
npm install next-connect
// or
yarn add next-connect
```

## Usage

`next-connect` is used in **Next.js 9 [API Routes](https://nextjs.org/docs#api-routes)** (those in `/pages/api/`). The usage is similar to [Express.js](https://github.com/expressjs/express/) but without `path` as the first argument.

When doing `export default`, use `handler.export()`.

```javascript
import nextConnect from 'next-connect'
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

//  export using handler.export()
export default handler.export();
```

### Use middleware

`handler.use(callback)`

`callback` is a function of `(req, res[, next])`.

```javascript
handler.use(function (req, res, next) {
    //  Do some stuff with req and res
    next();
})
//  Using with a library such as PassportJS
handler.use(passport.initialize());
```

#### Error middleware

Error middlewares will be called when an error is thrown. They should be placed at the end. Error middleware is similar to regular middleware except an addition `err` argument.

```javascript
app.get(function (req, res) {
    throw new Error('Oh no!');
})

app.use(function (err, req, res, next) {
    console.error(err);
    res.status(500).end('Internal Server Error');
    //  Optional chaining
    next();
})
app.use(function (err, req, res, next) {
    logger.log(err);
})
```

Notice that an error middleware **must** have four arguments. In case you do not want to have the `next` argument, use `app.error()` instead.

```javascript
//  This is still considered an error middleware
app.error(function (err, res, res) {
    console.error(err);
})
```

### Method routing

`handler.METHOD(callback[, callback ...])`

Route the HTTP request based on `METHOD`, where `METHOD` is the HTTP method (`GET`, `POST`, `PUT`, etc.) in lowercase.

`callback` is a function of `(req, res[, next])`. Method routing can be viewed as a middleware if you call `next()`.

There can be more than one argument, in which case it will act as a series of middleware functions.

#### Example of a single callback

```javascript
//  api/publicRoute.js
handler.post(function (req, res) {
    res.send('A public route');
})
```

#### Example of callbacks as middlewares

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

## Contributing

Please see my [contributing.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
