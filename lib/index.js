const Trouter = require("trouter");
const { deprecate } = require("util");

function onerror(err, req, res) {
  res.statusCode = err.code || err.status || 500;
  res.end(err.message || res.statusCode.toString());
}

const isResSent = (res) => res.finished || res.headersSent || res.writableEnded;
const mount = (fn) => (fn.routes ? fn.handle.bind(fn) : fn);

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
  const router = new Trouter();
  nc.routes = [];
  function add(...args) {
    if (typeof args[1] !== "string") args.splice(1, 0, "*");
    router.add.apply(nc, args);
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
    if (typeof base === "string") {
      router.use.apply(nc, [
        base,
        fns.map((fn) => {
          fn.baseUrl = base;
          return mount(fn);
        }),
      ]);
    } else router.use.apply(nc, ["/", [base, ...fns].map(mount)]);
    return nc;
  };
  nc.find = router.find.bind(nc);
  nc.run = function run(req, res) {
    return new Promise((resolve, reject) => {
      this.handle(req, res, (err) => (err ? reject(err) : resolve()));
    });
  };
  nc.apply = deprecate(nc.run, "next-connect: apply() is deprecated. Use run() instead.");
  nc.handle = function handle(req, res, done) {
    const idx = req.url.indexOf("?");
    const pathname = idx !== -1 ? req.url.substring(0, idx) : req.url;
    const { handlers } = this.find(
      req.method,
      this.baseUrl ? pathname.substring(this.baseUrl.length) : pathname
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
