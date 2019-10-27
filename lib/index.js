function constructLayer(method, handler, isErrorMiddleware = false) {
  return {
    handle: handler,
    method,
    isErrorMiddleware,
  };
}

const proto = {};

const httpMethods = ['get', 'head', 'post', 'put', 'delete', 'options', 'trace', 'patch'];
httpMethods.forEach((method) => {
  proto[method] = function (...args) {
    for (let i = 0; i < args.length; i += 1) {
      this.stack.push(constructLayer(method, args[i]));
    }
  };
});

proto.use = function use(handler) {
  if (handler.stack) Object.assign(this.stack, handler.stack);
  else this.stack.push(constructLayer('*', handler));
};

proto.error = function error(handler) {
  this.stack.push(constructLayer('*', handler, true));
};

proto.apply = function apply(req, res) {
  return new Promise((resolve) => this.handle(req, res, resolve));
};

proto.handle = function handle(req, res, done) {
  const _stack = this.stack;
  let _idx = 0;
  async function _next(nextErr) {
    const _layer = _stack[_idx];
    _idx += 1;

    //  all done
    if (!_layer) {
      if (done) done();
      else if (!res.headersSent) res.writeHead(404).end();
      return;
    }

    //  check if is correct method or middleware
    if (_layer.method !== '*' && _layer.method !== req.method.toLowerCase()) {
      _next(nextErr);
      return;
    }

    try {
      if (nextErr) {
        //  there is an error
        if (_layer.isErrorMiddleware || _layer.handle.length === 4) {
          await _layer.handle(nextErr, req, res, _next);
        } else throw nextErr;
      } else await _layer.handle(req, res, _next);
    } catch (err) {
      _next(err);
    }
  }

  //  Init stack chain
  _next();
};

function nextConnect() {
  function connect(req, res) {
    connect.handle(req, res);
  }
  Object.assign(connect, proto);
  connect.stack = [];

  return connect;
}

module.exports = nextConnect;
