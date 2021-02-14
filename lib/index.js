const Trouter = require("trouter");

function onerror(err, req, res) {
  res.statusCode = err.code || err.status || 500;
  res.end(err.message || res.statusCode.toString());
}

const isResSent = (res) => res.finished || res.headersSent || res.writableEnded;

module.exports = ({
  onError = onerror,
  onNoMatch = onerror.bind(null, { code: 404, message: "not found" }),
} = {}) => {
  function nc(req, res) {
    return nc.run(req, res).then(
      () => !isResSent(res) && onNoMatch(req, res),
      (err) => onError(err, req, res)
    );
  }
  nc.routes = [];
  nc.mountpath = "/";
  const _use = Trouter.prototype.use.bind(nc);
  const _find = Trouter.prototype.find.bind(nc);
  const _add = Trouter.prototype.add.bind(nc);
  function add(method, base, ...fns) {
    if (typeof base !== "string") return add(method, "*", base, ...fns);
    _add(method, base, ...fns);
    return nc;
  }
  nc.use = function use(base, ...fns) {
    if (typeof base !== "string") return this.use("/", base, ...fns);
    const mount = (fn) =>
      fn.routes ? (fn.mountpath = base) && fn.handle.bind(fn) : fn;
    _use(base, ...fns.map(mount));
    return nc;
  };
  nc.all = add.bind(nc, "");
  nc.get = add.bind(nc, "GET");
  nc.head = add.bind(nc, "HEAD");
  nc.post = add.bind(nc, "POST");
  nc.put = add.bind(nc, "PUT");
  nc.delete = add.bind(nc, "DELETE");
  nc.options = add.bind(nc, "OPTIONS");
  nc.trace = add.bind(nc, "TRACE");
  nc.patch = add.bind(nc, "PATCH");
  nc.run = function run(req, res) {
    return new Promise((resolve, reject) => {
      this.handle(req, res, (err) => (err ? reject(err) : resolve()));
    });
  };
  nc.handle = function handle(req, res, done) {
    const idx = req.url.indexOf("?");
    const pathname = idx !== -1 ? req.url.substring(0, idx) : req.url;
    const { handlers } = _find(
      req.method,
      this.mountpath !== "/"
        ? pathname.substring(this.mountpath.length)
        : pathname
    );
    let i = 0;
    const len = handlers.length;
    const loop = async (next) => handlers[i++](req, res, next);
    const next = (err) => {
      i < len
        ? err
          ? onError(err, req, res, next)
          : loop(next).catch(next)
        : done && done(err);
    };
    next();
  };
  return nc;
};
