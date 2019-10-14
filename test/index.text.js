/* eslint-disable no-unused-vars */
const assert = require('assert');
//  Next.js API Routes behaves similar to Node HTTP Server
const { createServer } = require('http');
const request = require('supertest');
const nextConnect = require('../lib');

const httpMethods = ['get', 'post', 'put', 'patch', 'delete'];

describe('nextConnect', () => {
  let handler;
  beforeEach(() => {
    handler = nextConnect();
  });
  context('method routing', () => {
    it('[method]() should response correctly to GET, POST, PUT, PATCH, DELETE', () => {
      httpMethods.forEach((method) => {
        handler[method]((req, res) => res.end(method));
      });
      const app = createServer(handler.export());
      const requestPromises = [];
      for (let i = 0; i < httpMethods.length; i += 1) {
        requestPromises.push(
          request(app)[httpMethods[i]]('/').expect(httpMethods[i]),
        );
      }
      return Promise.all(requestPromises);
    });
  });
  context('middleware', () => {
    it('use() should response to any method', () => {
      handler.use((req, res) => res.end('any'));
      const app = createServer(handler.export());
      const requestPromises = [];
      for (let i = 0; i < httpMethods.length; i += 1) {
        requestPromises.push(
          request(app)[httpMethods[i]]('/').expect('any'),
        );
      }
      return Promise.all(requestPromises);
    });

    it('use() should work as middleware', () => {
      handler.use((req, res, next) => {
        req.ok = 'ok';
        next();
      });
      handler.get((req, res) => {
        res.end(req.ok);
      });
      const app = createServer(handler.export());
      return request(app)
        .get('/')
        .expect('ok');
    });

    it('[method]() should be chainable', () => {
      handler.get((req, res, next) => {
        res.setHeader('x-ok', 'yes');
        next();
      }, (req, res) => {
        res.end('ok');
      });
      const app = createServer(handler.export());
      return request(app)
        .get('/')
        .expect('x-ok', 'yes')
        .expect('ok');
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
      const app = createServer(handler.export());
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
      const app = createServer(handler.export());
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
      const app = createServer(handler.export());
      return request(app)
        .get('/')
        .expect((res) => {
          assert(res.header['x-ok'] !== 'yes');
        })
        .expect('error');
    });
  });

  context('miscellaneous', () => {
    it('nextContext() should return an instance of NextConnect', () => {
      assert(nextConnect() instanceof nextConnect.NextConnect);
    });
    it('should return when run out of layer', () => {
      handler.get((req, res, next) => {
        next();
      }, (req, res, next) => {
        res.end('ok');
        // should exit after this not to throw
        next();
      });
      const app = createServer(handler.export());
      return request(app)
        .get('/')
        .expect('ok');
    });
  });
});
