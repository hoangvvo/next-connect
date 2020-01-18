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

    it('[method]() should be chainable', () => {
      handler.get(
        (req, res, next) => {
          res.setHeader('x-ok', 'yes');
          next();
        },
        (req, res) => {
          res.end('ok');
        },
      );
      const app = createServer(handler);
      return request(app)
        .get('/')
        .expect('x-ok', 'yes')
        .expect('ok');
    });
  });

  context('non-api support', () => {
    it('apply() should apply middleware to req and res', () => {
      handler.use((req, res, next) => { req.hello = 'world'; next(); });
      const app = createServer(async (req, res, next) => {
        await handler.apply(req, res);
        res.end(req.hello || '');
      });
      return request(app).get('/').expect('world');
    });
  });

  context('error handling', () => {
    it('use() with 4 args should work as an error middleware', () => {
      handler.get((req, res) => {
        throw new Error('error');
      });
      handler.use((err, req, res, next) => {
        res.end(err.message);
      });
      const app = createServer(handler);
      return request(app)
        .get('/')
        .expect('error');
    });

    it('error() should work as an error middleware', () => {
      handler.get((req, res) => {
        throw new Error('error');
      });
      handler.error((err, req, res) => {
        res.end(err.message);
      });
      const app = createServer(handler);
      return request(app)
        .get('/')
        .expect('error');
    });

    it('should bypass other handler if error thrown', () => {
      handler.get((req, res) => {
        throw new Error('error');
      });
      handler.use((req, res) => {
        res.setHeader('x-ok', 'yes');
        res.end('ok');
      });
      handler.error((err, req, res) => {
        res.end(err.message);
      });
      const app = createServer(handler);
      return request(app)
        .get('/')
        .expect((res) => {
          assert(res.header['x-ok'] !== 'yes');
        })
        .expect('error');
    });
  });

  context('init', () => {
    it('nextConnnet() should return a function with two argument', () => {
      assert(typeof nextConnect() === 'function' && nextConnect().length === 2);
    });

    it('should return when run out of layer', () => {
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

    it('404 if headers not sent', () => {
      handler.post((req, res) => {
        res.end('hmm');
      });

      const app = createServer(handler);
      return request(app)
        .get('/')
        .expect(404);
    });

    it('custom 404 if headers not sent', () => {
      function onNoMatch(req, res) {
        res.end('no page found... or is it');
      }

      const handler2 = nextConnect({ onNoMatch });
      const app = createServer(handler2);
      return request(app)
        .get('/')
        .expect(200);
    });
  });
});
