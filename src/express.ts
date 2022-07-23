import type { IncomingMessage, ServerResponse } from "http";
import type { RequestHandler } from "./node.js";
import type { Nextable } from "./types.js";

type NextFunction = (err?: any) => void;

type ExpressRequestHandler<Req, Res> = (
  req: Req,
  res: Res,
  next: NextFunction
) => void;

export function expressWrapper<
  Req extends IncomingMessage,
  Res extends ServerResponse
>(fn: ExpressRequestHandler<Req, Res>): Nextable<RequestHandler<Req, Res>> {
  return (req, res, next) => {
    return new Promise<void>((resolve, reject) => {
      fn(req, res, (err) => (err ? reject(err) : resolve()));
    }).then(next);
  };
}
