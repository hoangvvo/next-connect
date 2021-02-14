import Trouter from "trouter";

function onerror(err, req, res) {
  res.statusCode = err.status || 500;
  res.end(err.message);
}

const isResSent = (res) => res.finished || res.headersSent || res.writableEnded;

export default function factory({
  onError = onerror,
  onNoMatch = onerror.bind(null, { status: 404, message: "not found" }),
  attachParams = false,
} = {}) {
  function nc(req, res) {
    return nc.run(req, res).then(
      () => !isResSent(res) && onNoMatch(req, res),
      (err) => onError(err, req, res)
    );
  }
  nc.routes = [];
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
    if (base !== "/") {
      let slashAdded = false;
      fns.unshift((req, _, next) => {
        req.url = req.url.substring(base.length);
        if ((slashAdded = req.url[0] !== "/")) req.url = "/" + req.url;
        next();
      });
      fns.push(
        (req, _, next) =>
          (req.url = base + (slashAdded ? req.url.substring(1) : req.url)) &&
          next()
      );
    }
    const mount = (fn) => (fn.routes ? fn.handle.bind(fn) : fn);
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
    const { handlers, params } = _find(
      req.method,
      idx !== -1 ? req.url.substring(0, idx) : req.url
    );
    if (attachParams) req.params = params;
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
}
