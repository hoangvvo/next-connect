declare module "next-connect" {
  import { IncomingMessage, ServerResponse } from "http";

  type NextHandler = (err?: any) => void;
  type Middleware<Req, Res> = NextConnect<Req, Res> | RequestHandler<Req, Res>;

  type RequestHandler<Req, Res> = (
    req: Req,
    res: Res,
    next: NextHandler
  ) => any | Promise<any>;

  type ErrorHandler<Req, Res> = (
    err: any,
    req: Req,
    res: Res,
    next: NextHandler
  ) => any | Promise<any>;

  interface Options<Req, Res> {
    onError?: ErrorHandler<Req, Res>;
    onNoMatch?: RequestHandler<Req, Res>;
    attachParams?: boolean;
  }
  interface NextConnect<Req, Res> {
    (req: Req, res: Res): Promise<void>;

    use<ReqExt = {}, ResExt = {}>(
      ...handlers: Middleware<Req & ReqExt, Res & ResExt>[]
    ): this;
    use<ReqExt = {}, ResExt = {}>(
      pattern: string | RegExp,
      ...handlers: Middleware<Req & ReqExt, Res & ResExt>[]
    ): this;

    all<ReqExt = {}, ResExt = {}>(
      ...handlers: RequestHandler<Req & ReqExt, Res & ResExt>[]
    ): this;
    all<ReqExt = {}, ResExt = {}>(
      pattern: string | RegExp,
      ...handlers: RequestHandler<Req & ReqExt, Res & ResExt>[]
    ): this;

    get<ReqExt = {}, ResExt = {}>(
      ...handlers: RequestHandler<Req & ReqExt, Res & ResExt>[]
    ): this;
    get<ReqExt = {}, ResExt = {}>(
      pattern: string | RegExp,
      ...handlers: RequestHandler<Req & ReqExt, Res & ResExt>[]
    ): this;

    head<ReqExt = {}, ResExt = {}>(
      ...handlers: RequestHandler<Req & ReqExt, Res & ResExt>[]
    ): this;
    head<ReqExt = {}, ResExt = {}>(
      pattern: string | RegExp,
      ...handlers: RequestHandler<Req & ReqExt, Res & ResExt>[]
    ): this;

    post<ReqExt = {}, ResExt = {}>(
      ...handlers: RequestHandler<Req & ReqExt, Res & ResExt>[]
    ): this;
    post<ReqExt = {}, ResExt = {}>(
      pattern: string | RegExp,
      ...handlers: RequestHandler<Req & ReqExt, Res & ResExt>[]
    ): this;

    put<ReqExt = {}, ResExt = {}>(
      ...handlers: RequestHandler<Req & ReqExt, Res & ResExt>[]
    ): this;
    put<ReqExt = {}, ResExt = {}>(
      pattern: string | RegExp,
      ...handlers: RequestHandler<Req & ReqExt, Res & ResExt>[]
    ): this;

    delete<ReqExt = {}, ResExt = {}>(
      ...handlers: RequestHandler<Req & ReqExt, Res & ResExt>[]
    ): this;
    delete<ReqExt = {}, ResExt = {}>(
      pattern: string | RegExp,
      ...handlers: RequestHandler<Req & ReqExt, Res & ResExt>[]
    ): this;

    options<ReqExt = {}, ResExt = {}>(
      ...handlers: RequestHandler<Req & ReqExt, Res & ResExt>[]
    ): this;
    options<ReqExt = {}, ResExt = {}>(
      pattern: string | RegExp,
      ...handlers: RequestHandler<Req & ReqExt, Res & ResExt>[]
    ): this;

    trace<ReqExt = {}, ResExt = {}>(
      ...handlers: RequestHandler<Req & ReqExt, Res & ResExt>[]
    ): this;
    trace<ReqExt = {}, ResExt = {}>(
      pattern: string | RegExp,
      ...handlers: RequestHandler<Req & ReqExt, Res & ResExt>[]
    ): this;

    patch<ReqExt = {}, ResExt = {}>(
      ...handlers: RequestHandler<Req & ReqExt, Res & ResExt>[]
    ): this;
    patch<ReqExt = {}, ResExt = {}>(
      pattern: string | RegExp,
      ...handlers: RequestHandler<Req & ReqExt, Res & ResExt>[]
    ): this;

    run(req: Req, res: Res): Promise<void>;

    handle(req: Req, res: Res, done: NextHandler): void;
  }

  export default function <Req = IncomingMessage, Res = ServerResponse>(
    options?: Options<Req, Res>
  ): NextConnect<Req, Res>;
}
