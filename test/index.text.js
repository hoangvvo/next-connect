/* eslint-disable no-unused-vars */
const assert = require('assert');
//  Next.js API Routes behaves similar to Node HTTP Server
const { createServer } = require('http');
const request = require('supertest');
const nextConnect = require('../lib');

const METHODS = ['get', 'head', 'post', 'put', 'delete', 'options', 'trace', 'patch'];

describe('nextConnect', () => {
  let handler;
  beforeEach(() => {
    handler = nextConnect();
  });

  context('method routing', () => {
    it('should correctly match all without base', () => {
      METHODS.forEach((method) => {
        handler[method]((req, res) => res.end(method));
      });
      const app = createServer(handler);
      const requestPromises = [];
      METHODS.forEach((method) => {
        requestPromises.push(
          request(app)[method](`/${method}`).expect(method !== 'head' ? method : undefined),
        );
      });
      return Promise.all(requestPromises);
    });

    it('should correctly match path by base', () => {
      METHODS.forEach((method) => {
        handler[method](`/${method}`, (req, res) => res.end(method));
      });
      const app = createServer(handler);
      const requestPromises = [];
      METHODS.forEach((method) => {
        requestPromises.push(
          request(app)[method](`/${method}`).expect(method !== 'head' ? method : undefined),
        );
      });
      requestPromises.push(
        request(app).get('/yes').expect(404),
      );
      return Promise.all(requestPromises);
    });
  });

  context('middleware', () => {
    it('use() match all without base', () => {
      handler.use((req, res, next) => {
        req.ok = 'ok';
        next();
      });
      handler.get((req, res) => {
        res.end(req.ok);
      });
      const app = createServer(handler);
      return request(app)
        .get('/some/path')
        .expect('ok');
    });

    it('use() should match path by base', async () => {
      handler.use('/this/that/', (req, res, next) => {
        req.ok = 'ok';
        next();
      });
      handler.get((req, res) => {
        res.end(req.ok || 'no');
      });
      const app = createServer(handler);
      await request(app)
        .get('/some/path')
        .expect('no');
      await request(app).get('/this/that/these/those').expect('ok');
    });

    it('use() can reuse another instance', () => {
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
  });

  context('apply()', () => {
    it('apply() should apply middleware to req and res', () => {
      handler.use((req, res, next) => { req.hello = 'world'; next(); });
      const app = createServer(async (req, res, next) => {
        await handler.apply(req, res);
        res.end(req.hello || '');
      });
      return request(app).get('/').expect('world');
    });
  });

  context('onError', () => {
    it('should default to onerror', () => {
      handler
        .get((req, res) => {
          throw new Error('error');
        });

      const app = createServer(handler);
      return request(app)
        .get('/')
        .expect(500);
    });
    it('should use custom onError', async () => {
      function onError(err, req, res, next) {
        res.end('One does not simply ignore error');
      }
      const handler2 = nextConnect({ onError });
      handler2.get((req, res, next) => { next(Error()); });
      const app = createServer(handler2);
      await request(app).get('/').expect(200);
    });
    it('should continue chain with next', () => {
      function onError(err, req, res, next) {
        next();
      }
      const handler2 = nextConnect({ onError });
      handler2
        .get((req, res, next) => { next(Error()); })
        .get((req, res) => res.end('no error'));
      const app = createServer(handler2);
      return request(app).get('/').expect('no error');
    });
  });

  context('misc', () => {
    it('nextConnnet() should return a function with two argument', () => {
      assert(typeof nextConnect() === 'function' && nextConnect().length === 2);
    });

    it('should return if no more routes available', () => {
      handler.get(
        (req, res, next) => {
          res.end('ok');
          next();
        },
      );

      const app = createServer(handler);
      return request(app)
        .get('/')
        .expect('ok');
    });

    it('should response default 404 if no response', () => {
      handler.post((req, res) => {
        res.end('');
      });

      const app = createServer(handler);
      return request(app)
        .get('/')
        .expect(404);
    });

    it('should response custom 404 if no response', () => {
      function onNoMatch(req, res) {
        res.end('');
      }

      const handler2 = nextConnect({ onNoMatch });
      const app = createServer(handler2);
      return request(app)
        .get('/')
        .expect(200);
    });

    it('should be chainable', () => {
      handler
        .use((req, res, next) => {
          req.four = '4';
          next();
        }, (req, res, next) => {
          res.setHeader('2-plus-2-is', req.four);
          next();
        })
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
  });
});
