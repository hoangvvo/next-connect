/* eslint-disable no-underscore-dangle */
function constructStack(method, handler, isErrorMiddleware = false) {
  return {
    handle: handler,
    method,
    isErrorMiddleware,
  };
}

class NextConnect {
  constructor() {
    this.stacks = [];
    this.ended = true;
    //  routing methods

    const httpMethods = ['get', 'post', 'put', 'patch', 'delete'];
    httpMethods.forEach((method) => {
      this[method] = (...args) => {
        args.forEach((handler) => {
          this.stacks.push(constructStack(method, handler));
        });
      };
    });
  }

  use(handler) {
    this.stacks.push(constructStack('*', handler));
  }

  error(handler) {
    this.stacks.push(constructStack('*', handler, true));
  }

  export() {
    return (req, res) => {
      const _stacks = this.stacks;
      let _idx = 0;
      async function _next(nextErr) {
        const _layer = _stacks[_idx];
        _idx += 1;

        //  all done
        if (!_layer) return;

        if (
          _layer.method !== '*'
          && _layer.method !== req.method.toLowerCase()
        ) {
          _next(nextErr);
          return;
        }

        //  Method matched or is middleware
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

      //  Init stack chains
      _next();
    };
  }
}

module.exports = () => new NextConnect();
module.exports.NextConnect = NextConnect;
