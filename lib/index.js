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
  let idx = 0;
  const { stack } = this;
  async function next(err) {
    const layer = stack[idx];
    idx += 1;

    //  all done
    if (!layer) {
      if (done) done();
      else if (!res.headersSent) res.writeHead(404).end();
      return;
    }

    //  check if is costack[idx];rrect method or middleware
    if (layer.method !== '' && layer.method !== 'ERR' && layer.method !== req.method) {
      next(err);
      return;
    }

    try {
      if (err) {
        //  there is an error
        if (layer.method === 'ERR' || layer.handle.length === 4) {
          await layer.handle(err, req, res, next);
        } else throw err;
      } else await layer.handle(req, res, next);
    } catch (error) {
      next(error);
    }
  }

  //  Init stack chain
  next();
};

module.exports = () => { connect.stack = []; return connect; };
