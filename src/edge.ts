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

export type RequestHandler<Req extends Request, Ctx> = (
  req: Req,
  ctx: Ctx
) => ValueOrPromise<Response | void>;

export class EdgeRouter<Req extends Request = Request, Ctx = unknown> {
  private router = new Router<RequestHandler<Req, Ctx>>();

  private add(
    method: HttpMethod | "",
    route: RouteMatch | Nextable<RequestHandler<Req, Ctx>>,
    ...fns: Nextable<RequestHandler<Req, Ctx>>[]
  ) {
    this.router.add(method, route, ...fns);
    return this;
  }

  public all: RouteShortcutMethod<this, RequestHandler<Req, Ctx>> =
    this.add.bind(this, "");
  public get: RouteShortcutMethod<this, RequestHandler<Req, Ctx>> =
    this.add.bind(this, "GET");
  public head: RouteShortcutMethod<this, RequestHandler<Req, Ctx>> =
    this.add.bind(this, "HEAD");
  public post: RouteShortcutMethod<this, RequestHandler<Req, Ctx>> =
    this.add.bind(this, "POST");
  public put: RouteShortcutMethod<this, RequestHandler<Req, Ctx>> =
    this.add.bind(this, "PUT");
  public patch: RouteShortcutMethod<this, RequestHandler<Req, Ctx>> =
    this.add.bind(this, "PATCH");
  public delete: RouteShortcutMethod<this, RequestHandler<Req, Ctx>> =
    this.add.bind(this, "DELETE");

  public use(
    base:
      | RouteMatch
      | Nextable<RequestHandler<Req, Ctx>>
      | EdgeRouter<Req, Ctx>,
    ...fns: (Nextable<RequestHandler<Req, Ctx>> | EdgeRouter<Req, Ctx>)[]
  ) {
    if (typeof base === "function" || base instanceof EdgeRouter) {
      fns.unshift(base);
      base = "/";
    }
    this.router.use(
      base,
      ...fns.map((fn) => (fn instanceof EdgeRouter ? fn.router : fn))
    );
    return this;
  }

  private prepareRequest(
    req: Req & { params?: Record<string, unknown> },
    ctx: Ctx,
    findResult: FindResult<RequestHandler<Req, Ctx>>
  ) {
    req.params = {
      ...findResult.params,
      ...req.params, // original params will take precedence
    };
  }

  public clone() {
    const r = new EdgeRouter<Req, Ctx>();
    r.router = this.router.clone();
    return r;
  }

  async run(req: Req, ctx: Ctx) {
    const result = this.router.find(req.method as HttpMethod, getPathname(req));
    if (!result.fns.length) return;
    this.prepareRequest(req, ctx, result);
    return Router.exec(result.fns, req, ctx);
  }

  handler(options: HandlerOptions<RequestHandler<Req, Ctx>> = {}) {
    const onNoMatch = options.onNoMatch || onnomatch;
    const onError = options.onError || onerror;
    return async (req: Req, ctx: Ctx): Promise<any> => {
      const result = this.router.find(
        req.method as HttpMethod,
        getPathname(req)
      );
      this.prepareRequest(req, ctx, result);
      try {
        if (result.fns.length === 0 || result.middleOnly) {
          return await onNoMatch(req, ctx);
        } else {
          return await Router.exec(result.fns, req, ctx);
        }
      } catch (err) {
        return onError(err, req, ctx);
      }
    };
  }
}

function onnomatch(req: Request) {
  return new Response(
    req.method !== "HEAD" ? `Route ${req.method} ${req.url} not found` : null,
    { status: 404 }
  );
}
function onerror(err: unknown) {
  console.error(err);
  return new Response("Internal Server Error", { status: 500 });
}

export function getPathname(req: Request & { nextUrl?: URL }) {
  return (req.nextUrl || new URL(req.url)).pathname;
}

export function createEdgeRouter<Req extends Request, Ctx>() {
  return new EdgeRouter<Req, Ctx>();
}
