import { Router } from "./router.js";
import type {
  FindResult,
  HandlerOptions,
  HttpMethod,
  ValueOrPromise,
} from "./types.js";

export type RequestHandler<Req extends Request, Ctx> = (
  req: Req,
  ctx: Ctx
) => ValueOrPromise<Response | void>;

export class EdgeRouter<
  Req extends Request = Request,
  Ctx = unknown
> extends Router<RequestHandler<Req, Ctx>> {
  constructor() {
    super();
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
  async run(req: Req, ctx: Ctx) {
    const result = this.find(req.method as HttpMethod, getPathname(req));
    if (!result.fns.length) return;
    this.prepareRequest(req, ctx, result);
    return Router.exec(result.fns, req, ctx);
  }
  handler(options: HandlerOptions<RequestHandler<Req, Ctx>> = {}) {
    const onNoMatch = options.onNoMatch || onnomatch;
    const onError = options.onError || onerror;
    return async (req: Req, ctx: Ctx): Promise<any> => {
      const result = this.find(req.method as HttpMethod, getPathname(req));
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
