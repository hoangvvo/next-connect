import type { IncomingMessage, ServerResponse } from "http";
import { Router } from "./router.js";
import type { HandlerOptions, HttpMethod } from "./types.js";

export type RequestHandler<
  Req extends IncomingMessage,
  Res extends ServerResponse
> = (req: Req, res: Res) => void | Promise<void>;

export class NodeRouter<
  Req extends IncomingMessage = IncomingMessage,
  Res extends ServerResponse = ServerResponse
> extends Router<RequestHandler<Req, Res>> {
  async run(req: Req, res: Res) {
    const { fns } = this.find(
      req.method as HttpMethod,
      getPathname(req.url as string)
    );
    if (!fns.length) return;
    return Router.exec(fns, req, res);
  }
  handler(options?: HandlerOptions<RequestHandler<Req, Res>>) {
    const onNoMatch = options?.onNoMatch || onnomatch;
    const onError = options?.onError || onerror;
    return async (req: Req, res: Res) => {
      const { fns, middleOnly } = this.find(
        req.method as HttpMethod,
        getPathname(req.url as string)
      );
      try {
        if (fns.length === 0 || middleOnly) {
          await onNoMatch(req, res);
        } else {
          await Router.exec(fns, req, res);
        }
      } catch (err) {
        await onError(err, req, res);
      }
    };
  }
}

function onnomatch(req: IncomingMessage, res: ServerResponse) {
  res.statusCode = 404;
  res.end(req.method !== "HEAD" && `Route ${req.method} ${req.url} not found`);
}
function onerror(err: unknown, req: IncomingMessage, res: ServerResponse) {
  res.statusCode = 500;
  // @ts-expect-error: we render regardless
  res.end(err?.stack);
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