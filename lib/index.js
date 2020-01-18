const Trouter = require('trouter');

function onerror(err, req, res) {
  res.statusCode = err.code || err.status || 500;
  res.end(err.message || res.statusCode.toString());
}

module.exports = ({
  onError = onerror,
  onNoMatch = onerror.bind(null, { code: 404, message: 'not found' }),
} = {}) => {
  function connect(req, res) {
    connect.handle(req, res);
  }
  const router = new Trouter();
  connect.routes = [];
  function add(...args) {
    if (typeof args[1] !== 'string') args.splice(1, 0, '*');
    router.add.apply(connect, args);
    return connect;
  }
  // method routing
  connect.get = add.bind(connect, 'GET');
  connect.head = add.bind(connect, 'HEAD');
  connect.post = add.bind(connect, 'POST');
  connect.put = add.bind(connect, 'PUT');
  connect.delete = add.bind(connect, 'DELETE');
  connect.options = add.bind(connect, 'OPTIONS');
  connect.trace = add.bind(connect, 'TRACE');
  connect.patch = add.bind(connect, 'PATCH');
  // middleware
  const mount = (fn) => (fn.routes
    ? (req, res, next) => {
      setImmediate(fn.handle.bind(fn), req, res, next);
    }
    : fn);
  connect.use = function use(base, ...fns) {
    if (typeof base === 'string') {
      router.use.apply(connect, [base, fns.map(mount)]);
    } else router.use.apply(connect, ['/', [base, ...fns].map(mount)]);
    return connect;
  };
  connect.find = router.find.bind(connect);
  connect.apply = function apply(req, res) {
    return new Promise((resolve) => this.handle(req, res, resolve));
  };
  connect.handle = function handle(req, res, done) {
    let i = 0;
    const { handlers } = this.find(req.method, req.url);
    async function next(err) {
      const handler = handlers[i];
      //  all done
      if (!handler) {
        if (done) done();
        else if (err) onError(err, req, res);
        else if (
          !err
          && (res.writableEnded === false || res.finished === false)
        ) {
          setImmediate(onNoMatch, req, res);
        }
        return;
      }
      try {
        if (!err) {
          i += 1;
          handler(req, res, next);
        } else onError(err, req, res, next);
      } catch (error) {
        next(error);
      }
    }
    next();
  };

  return connect;
};
