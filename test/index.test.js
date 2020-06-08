/* eslint-disable no-unused-vars */
const assert = require('assert');
//  Next.js API Routes behaves similar to Node HTTP Server
const { createServer } = require('http');
const request = require('supertest');
const nextConnect = require('../lib');

const METHODS = ['get', 'head', 'post', 'put', 'delete', 'options', 'trace', 'patch'];

let handler;
beforeEach(() => {
  handler = nextConnect();
});

describe('nc()', () => {
  it('is chainable', () => {
    handler
      .use(
        (req, res, next) => {
          req.four = '4';
          next();
        },
        (req, res, next) => {
          res.setHeader('2-plus-2-is', req.four);
          next();
        }
      )
      .get((req, res) => {
        // minus 3 is 1
        res.end('quick math');
      });
    const app = createServer(handler);
    return request(app)
      .get('/')
      .expect('2-plus-2-is', '4')
      .expect('quick math');
  });

  it('is a function with two argument', () => {
    assert(typeof nextConnect() === 'function' && nextConnect().length === 2);
  });

  it('returns a promise', () => {
    handler({}, { end: () => null }).then((e) => {
      /* no-op */
    });
  });
});

describe('.METHOD', () => {
  it('match all without path', () => {
    METHODS.forEach((method) => {
      handler[method]((req, res) => res.end(method));
    });
    const app = createServer(handler);
    const requestPromises = [];
    METHODS.forEach((method) => {
      requestPromises.push(
        request(app)[method](`/${method}`).expect(method !== 'head' ? method : undefined)
      );
    });
    return Promise.all(requestPromises);
  });

  it('match by path', () => {
    METHODS.forEach((method) => {
      handler[method](`/${method}`, (req, res) => res.end(method));
    });
    const app = createServer(handler);
    const requestPromises = [];
    METHODS.forEach((method) => {
      requestPromises.push(
        request(app)[method](`/${method}`).expect(method !== 'head' ? method : undefined)
      );
    });
    requestPromises.push(request(app).get('/yes').expect(404));
    return Promise.all(requestPromises);
  });
});

describe('use()', () => {
  it('match all without base', async () => {
    handler.use((req, res, next) => {
      req.ok = 'ok';
      next();
    });
    handler.get((req, res) => {
      res.end(req.ok);
    });
    const app = createServer(handler);
    await request(app).get('/').expect('ok');
    await request(app).get('/some/path').expect('ok');
  });

  it('match path by base', async () => {
    handler.use('/this/that/', (req, res, next) => {
      req.ok = 'ok';
      next();
    });
    handler.get((req, res) => {
      res.end(req.ok || 'no');
    });
    const app = createServer(handler);
    await request(app).get('/some/path').expect('no');
    await request(app).get('/this/that/these/those').expect('ok');
  });

  it('mount subapp', () => {
    const handler2 = nextConnect();
    handler2.use((req, res, next) => {
      req.hello = 'world';
      next();
    });

    handler.use(handler2);
    handler.use((req, res) => res.end(req.hello));

    const app = createServer(handler);
    return request(app).get('/').expect('world');
  });

  it('mount subapp with base', async () => {
    const handler2 = nextConnect();
    handler2.get('/foo', (req, res) => {
      res.end('ok');
    });
    handler.use('/sub', handler2);
    const app = createServer(handler);
    await request(app).get('/sub/foo').expect('ok');
    await request(app).get('/sub').expect(404);
    await request(app).get('/foo').expect(404);
  });
});

describe('handle()', () => {
  it('response with default 404 on no match', () => {
    handler.post((req, res) => {
      res.end('');
    });

    const app = createServer(handler);
    return request(app).get('/').expect(404);
  });

  it('response with custom 404 on no match', () => {
    function onNoMatch(req, res) {
      res.end('');
    }

    const handler2 = nextConnect({ onNoMatch });
    const app = createServer(handler2);
    return request(app).get('/').expect(200);
  });
});

describe('apply()', () => {
  it('apply middleware to req and res', () => {
    handler.use((req, res, next) => {
      req.hello = 'world';
      next();
    });
    const app = createServer(async (req, res, next) => {
      await handler.apply(req, res);
      res.end(req.hello || '');
    });
    return request(app).get('/').expect('world');
  });

  it('reject if there is an error', () => {
    handler.use(() => {
      throw new Error('error :(');
    });
    const app = createServer(async (req, res, next) => {
      try {
        await handler.apply(req, res);
        res.end('good');
      } catch (e) {
        res.end(e.toString());
      }
    });
    return request(app).get('/').expect('Error: error :(');
  });
});

describe('onError', () => {
  it('default to onerror', () => {
    handler.get((req, res) => {
      throw new Error('error');
    });

    const app = createServer(handler);
    return request(app).get('/').expect(500).expect('error');
  });

  it('use custom onError', async () => {
    function onError(err, req, res, next) {
      res.end('One does not simply ignore error');
    }
    const handler2 = nextConnect({ onError });
    handler2.use((req, res, next) => {
      next();
    });
    handler2.get((req, res, next) => {
      throw new Error('wackk');
    });
    const app = createServer(handler2);
    await request(app)
      .get('/')
      .expect(200)
      .expect('One does not simply ignore error');
  });

  it('continue chain with next', () => {
    function onError(err, req, res, next) {
      next();
    }
    const handler2 = nextConnect({ onError });
    handler2
      .get((req, res, next) => next())
      .get((req, res, next) => {
        throw new Error();
      })
      .get((req, res) => res.end('no error'));
    const app = createServer(handler2);
    return request(app).get('/').expect('no error');
  });

  it('catch async errors', () => {
    function onError(err, req, res, next) {
      res.end(err.message);
    }
    const handler2 = nextConnect({ onError });
    handler2.use((req, res, next) => {
      next();
    });
    handler2.use(async (req, res) => {
      throw new Error('Something failed');
    });
    handler2.get(async (req, res) => res.end('ok'));
    const app = createServer(handler2);
    return request(app).get('/').expect('Something failed');
  });
});
