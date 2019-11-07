function connect(req, res) {
  connect.handle(req, res);
}

function add(method, ...handle) {
  for (let i = 0; i < handle.length; i += 1) {
    if (handle[i].stack) Object.assign(this.stack, handle[i].stack);
    else this.stack.push({ handle: handle[i], method });
  }
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
connect.use = add.bind(connect, '');
connect.error = add.bind(connect, 'ERR');

connect.apply = function apply(req, res) {
  return new Promise((resolve) => this.handle(req, res, resolve));
};

connect.handle = function handle(req, res, done) {
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
    if (_layer.method !== '' && _layer.method !== 'ERR' && _layer.method !== req.method) {
      _next(nextErr);
      return;
    }

    try {
      if (nextErr) {
        //  there is an error
        if (_layer.method === 'ERR' || _layer.handle.length === 4) {
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

module.exports = () => { connect.stack = []; return connect; };
