import type { IncomingMessage, ServerResponse } from "http";
import { Router } from "./router.js";
import type {
  FindResult,
  HandlerOptions,
  HttpMethod,
  Nextable,
  RouteMatch,
  RouteShortcutMethod,
  ValueOrPromise,
} from "./types.js";

export type RequestHandler<
  Req extends IncomingMessage,
  Res extends ServerResponse
> = (req: Req, res: Res) => ValueOrPromise<void>;

export class NodeRouter<
  Req extends IncomingMessage = IncomingMessage,
  Res extends ServerResponse = ServerResponse
> {
  private router = new Router<RequestHandler<Req, Res>>();

  private add(
    method: HttpMethod | "",
    route: RouteMatch | Nextable<RequestHandler<Req, Res>>,
    ...fns: Nextable<RequestHandler<Req, Res>>[]
  ) {
    this.router.add(method, route, ...fns);
    return this;
  }

  public all: RouteShortcutMethod<this, RequestHandler<Req, Res>> =
    this.add.bind(this, "");
  public get: RouteShortcutMethod<this, RequestHandler<Req, Res>> =
    this.add.bind(this, "GET");
  public head: RouteShortcutMethod<this, RequestHandler<Req, Res>> =
    this.add.bind(this, "HEAD");
  public post: RouteShortcutMethod<this, RequestHandler<Req, Res>> =
    this.add.bind(this, "POST");
  public put: RouteShortcutMethod<this, RequestHandler<Req, Res>> =
    this.add.bind(this, "PUT");
  public patch: RouteShortcutMethod<this, RequestHandler<Req, Res>> =
    this.add.bind(this, "PATCH");
  public delete: RouteShortcutMethod<this, RequestHandler<Req, Res>> =
    this.add.bind(this, "DELETE");

  public use(
    base:
      | RouteMatch
      | Nextable<RequestHandler<Req, Res>>
      | NodeRouter<Req, Res>,
    ...fns: (Nextable<RequestHandler<Req, Res>> | NodeRouter<Req, Res>)[]
  ) {
    if (typeof base === "function" || base instanceof NodeRouter) {
      fns.unshift(base);
      base = "/";
    }
    this.router.use(
      base,
      ...fns.map((fn) => (fn instanceof NodeRouter ? fn.router : fn))
    );
    return this;
  }

  private prepareRequest(
    req: Req & { params?: Record<string, unknown> },
    res: Res,
    findResult: FindResult<RequestHandler<Req, Res>>
  ) {
    req.params = {
      ...findResult.params,
      ...req.params, // original params will take precedence
    };
  }

  public clone() {
    const r = new NodeRouter();
    r.router = this.router.clone();
    return r;
  }

  async run(req: Req, res: Res) {
    const result = this.router.find(
      req.method as HttpMethod,
      getPathname(req.url as string)
    );
    if (!result.fns.length) return;
    this.prepareRequest(req, res, result);
    return Router.exec(result.fns, req, res);
  }

  handler(options: HandlerOptions<RequestHandler<Req, Res>> = {}) {
    const onNoMatch = options.onNoMatch || onnomatch;
    const onError = options.onError || onerror;
    return async (req: Req, res: Res) => {
      const result = this.router.find(
        req.method as HttpMethod,
        getPathname(req.url as string)
      );
      this.prepareRequest(req, res, result);
      try {
        if (result.fns.length === 0 || result.middleOnly) {
          await onNoMatch(req, res);
        } else {
          await Router.exec(result.fns, req, res);
        }
      } catch (err) {
        await onError(err, req, res);
      }
    };
  }
}

function onnomatch(req: IncomingMessage, res: ServerResponse) {
  res.statusCode = 404;
  res.end(
    req.method !== "HEAD"
      ? `Route ${req.method} ${req.url} not found`
      : undefined
  );
}

function onerror(err: unknown, req: IncomingMessage, res: ServerResponse) {
  res.statusCode = 500;
  console.error(err);
  res.end("Internal Server Error");
}

export function getPathname(url: string) {
  const queryIdx = url.indexOf("?");
  return queryIdx !== -1 ? url.substring(0, queryIdx) : url;
}

export function createRouter<
  Req extends IncomingMessage,
  Res extends ServerResponse
>() {
  return new NodeRouter<Req, Res>();
}
