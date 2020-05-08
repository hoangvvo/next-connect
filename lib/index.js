const Trouter = require('trouter');

function onerror(err, req, res) {
  res.statusCode = err.code || err.status || 500;
  res.end(err.message || res.statusCode.toString());
}

const isResSent = (res) => res.finished || res.headersSent || res.writableEnded;
const mount = (fn) => (fn.routes ? fn.handle.bind(fn) : fn);

module.exports = ({
  onError = onerror,
  onNoMatch = onerror.bind(null, { code: 404, message: 'not found' }),
} = {}) => {
  function connect(req, res) {
    return connect.apply(req, res).then(
      () => !isResSent(res) && onNoMatch(req, res),
      (err) => onError(err, req, res)
    );
  }
  const router = new Trouter();
  connect.routes = [];
  function add(...args) {
    if (typeof args[1] !== 'string') args.splice(1, 0, '*');
    router.add.apply(connect, args);
    return connect;
  }
  connect.get = add.bind(connect, 'GET');
  connect.head = add.bind(connect, 'HEAD');
  connect.post = add.bind(connect, 'POST');
  connect.put = add.bind(connect, 'PUT');
  connect.delete = add.bind(connect, 'DELETE');
  connect.options = add.bind(connect, 'OPTIONS');
  connect.trace = add.bind(connect, 'TRACE');
  connect.patch = add.bind(connect, 'PATCH');
  connect.use = function use(base, ...fns) {
    if (typeof base === 'string') {
      router.use.apply(connect, [base, fns.map(mount)]);
    } else router.use.apply(connect, ['/', [base, ...fns].map(mount)]);
    return connect;
  };
  connect.find = router.find.bind(connect);
  connect.apply = function apply(req, res) {
    return new Promise((resolve, reject) => {
      this.handle(req, res, (err) => (err ? reject(err) : resolve()));
    });
  };
  connect.handle = function handle(req, res, done) {
    const { handlers } = this.find(req.method, req.url);
    let i = 0;
    const len = handlers.length;
    const next = (err) =>
      i < len
        ? err
          ? onError(err, req, res, next)
          : loop().catch(next)
        : done && done(err);
    async function loop() {
      return handlers[i++](req, res, next);
    }
    next();
  };
  return connect;
};
