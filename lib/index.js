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
  function add(method, base, ...fns) {
    if (typeof base !== "string") return add(method, "*", base, ...fns);
    Trouter.prototype.add.call(nc, method, base, ...fns);
    return nc;
  }
  nc.all = add.bind(nc, "");
  nc.get = add.bind(nc, "GET");
  nc.head = add.bind(nc, "HEAD");
  nc.post = add.bind(nc, "POST");
  nc.put = add.bind(nc, "PUT");
  nc.delete = add.bind(nc, "DELETE");
  nc.options = add.bind(nc, "OPTIONS");
  nc.trace = add.bind(nc, "TRACE");
  nc.patch = add.bind(nc, "PATCH");
  nc.use = function use(base, ...fns) {
    if (typeof base !== "string") return this.use("/", base, ...fns);
    Trouter.prototype.use.call(
      nc,
      base,
      ...fns.map((fn) => {
        if (fn.routes) {
          fn.mountpath = base;
          return fn.handle.bind(fn);
        }
        return fn;
      })
    );
    return nc;
  };
  nc.run = function run(req, res) {
    return new Promise((resolve, reject) => {
      this.handle(req, res, (err) => (err ? reject(err) : resolve()));
    });
  };
  const find = Trouter.prototype.find.bind(nc);
  nc.handle = function handle(req, res, done) {
    const idx = req.url.indexOf("?");
    const pathname = idx !== -1 ? req.url.substring(0, idx) : req.url;
    const { handlers } = find(
      req.method,
      this.mountpath !== "/"
        ? pathname.substring(this.mountpath.length)
        : pathname
    );
    let i = 0;
    const len = handlers.length;
    const next = (err) => {
      i < len
        ? err
          ? onError(err, req, res, next)
          : loop().catch(next)
        : done && done(err);
    };
    async function loop() {
      return handlers[i++](req, res, next);
    }
    next();
  };
  return nc;
};
