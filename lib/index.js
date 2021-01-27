const parse = require("regexparam");

const onerror = (err, req, res) => {
  res.statusCode = err.code || err.status || 500;
  res.end(err.message || res.statusCode.toString());
};

const isResSent = (res) => res.finished || res.headersSent || res.writableEnded;
const mount = (fn) => (fn.routes ? fn.handle.bind(fn) : fn);

function use(route, ...fns) {
  if (typeof route !== "string") return this.use("/", route, ...fns);
  let { keys, pattern } = parse(route, true);
  const handlers = fns.map((fn) => {
    fn.baseUrl = route;
    return mount(fn);
  });
  this.routes.push({ keys, pattern, method: "", handlers });
  return this;
}

function add(method, route, ...fns) {
  if (typeof route !== "string") return this.add(method, "*", route, ...fns);
  let { keys, pattern } = parse(route);
  this.routes.push({ keys, pattern, method, handlers: fns });
  return this;
}

function find(method, url) {
  let isHEAD = method === "HEAD";
  let i = 0,
    j = 0,
    k,
    tmp,
    arr = this.routes;
  let matches = [],
    params = {},
    handlers = [];
  for (; i < arr.length; i++) {
    tmp = arr[i];
    if (
      tmp.method.length === 0 ||
      tmp.method === method ||
      (isHEAD && tmp.method === "GET")
    ) {
      if (tmp.keys === false) {
        matches = tmp.pattern.exec(url);
        if (matches === null) continue;
        if (matches.groups !== void 0)
          for (k in matches.groups) params[k] = matches.groups[k];
        tmp.handlers.length > 1
          ? (handlers = handlers.concat(tmp.handlers))
          : handlers.push(tmp.handlers[0]);
      } else if (tmp.keys.length > 0) {
        matches = tmp.pattern.exec(url);
        if (matches === null) continue;
        for (j = 0; j < tmp.keys.length; ) params[tmp.keys[j]] = matches[++j];
        tmp.handlers.length > 1
          ? (handlers = handlers.concat(tmp.handlers))
          : handlers.push(tmp.handlers[0]);
      } else if (tmp.pattern.test(url)) {
        tmp.handlers.length > 1
          ? (handlers = handlers.concat(tmp.handlers))
          : handlers.push(tmp.handlers[0]);
      }
    } // else not a match
  }
  return { params, handlers };
}

function run(req, res) {
  return new Promise((resolve, reject) =>
    this.handle(req, res, (err) => (err ? reject(err) : resolve()))
  );
}

function handle(req, res, done) {
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
        ? this.onError(err, req, res, next)
        : loop().catch(next)
      : done(err);
  };
  async function loop() {
    return handlers[i++](req, res, next);
  }
  next();
}

module.exports = (options = {}) => {
  function nc(req, res) {
    return nc.run(req, res).then(
      () => !isResSent(res) && nc.onNoMatch(req, res),
      (err) => nc.onError(err, req, res)
    );
  }
  nc.onError = options.onError || onerror;
  nc.onNoMatch =
    options.onNoMatch ||
    onerror.bind(null, { code: 404, message: "not found" });
  nc.routes = [];
  nc.add = add.bind(nc);
  nc.all = add.bind(nc, "");
  nc.get = add.bind(nc, "GET");
  nc.head = add.bind(nc, "HEAD");
  nc.post = add.bind(nc, "POST");
  nc.put = add.bind(nc, "PUT");
  nc.delete = add.bind(nc, "DELETE");
  nc.options = add.bind(nc, "OPTIONS");
  nc.trace = add.bind(nc, "TRACE");
  nc.patch = add.bind(nc, "PATCH");
  nc.use = use.bind(nc);
  nc.find = find.bind(nc);
  nc.run = run.bind(nc);
  nc.handle = handle.bind(nc);
  return nc;
};
