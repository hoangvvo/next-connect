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

  export interface Options<Req, Res> {
    onError?: ErrorHandler<Req, Res>;
    onNoMatch?: RequestHandler<Req, Res>;
    attachParams?: boolean;
  }
  interface NextConnect<Req, Res> {
    (req: Req, res: Res): Promise<void>;

    use<ReqExt extends Req = Req, ResExt extends Res = Res>(
      ...handlers: Middleware<ReqExt, ResExt>[]
    ): this;
    use<ReqExt extends Req = Req, ResExt extends Res = Res>(
      pattern: string | RegExp,
      ...handlers: Middleware<ReqExt, ResExt>[]
    ): this;

    all<ReqExt extends Req = Req, ResExt extends Res = Res>(
      ...handlers: RequestHandler<ReqExt, ResExt>[]
    ): this;
    all<ReqExt extends Req = Req, ResExt extends Res = Res>(
      pattern: string | RegExp,
      ...handlers: RequestHandler<ReqExt, ResExt>[]
    ): this;

    get<ReqExt extends Req = Req, ResExt extends Res = Res>(
      ...handlers: RequestHandler<ReqExt, ResExt>[]
    ): this;
    get<ReqExt extends Req = Req, ResExt extends Res = Res>(
      pattern: string | RegExp,
      ...handlers: RequestHandler<ReqExt, ResExt>[]
    ): this;

    head<ReqExt extends Req = Req, ResExt extends Res = Res>(
      ...handlers: RequestHandler<ReqExt, ResExt>[]
    ): this;
    head<ReqExt extends Req = Req, ResExt extends Res = Res>(
      pattern: string | RegExp,
      ...handlers: RequestHandler<ReqExt, ResExt>[]
    ): this;

    post<ReqExt extends Req = Req, ResExt extends Res = Res>(
      ...handlers: RequestHandler<ReqExt, ResExt>[]
    ): this;
    post<ReqExt extends Req = Req, ResExt extends Res = Res>(
      pattern: string | RegExp,
      ...handlers: RequestHandler<ReqExt, ResExt>[]
    ): this;

    put<ReqExt extends Req = Req, ResExt extends Res = Res>(
      ...handlers: RequestHandler<ReqExt, ResExt>[]
    ): this;
    put<ReqExt extends Req = Req, ResExt extends Res = Res>(
      pattern: string | RegExp,
      ...handlers: RequestHandler<ReqExt, ResExt>[]
    ): this;

    delete<ReqExt extends Req = Req, ResExt extends Res = Res>(
      ...handlers: RequestHandler<ReqExt, ResExt>[]
    ): this;
    delete<ReqExt extends Req = Req, ResExt extends Res = Res>(
      pattern: string | RegExp,
      ...handlers: RequestHandler<ReqExt, ResExt>[]
    ): this;

    options<ReqExt extends Req = Req, ResExt extends Res = Res>(
      ...handlers: RequestHandler<ReqExt, ResExt>[]
    ): this;
    options<ReqExt extends Req = Req, ResExt extends Res = Res>(
      pattern: string | RegExp,
      ...handlers: RequestHandler<ReqExt, ResExt>[]
    ): this;

    trace<ReqExt extends Req = Req, ResExt extends Res = Res>(
      ...handlers: RequestHandler<ReqExt, ResExt>[]
    ): this;
    trace<ReqExt extends Req = Req, ResExt extends Res = Res>(
      pattern: string | RegExp,
      ...handlers: RequestHandler<ReqExt, ResExt>[]
    ): this;

    patch<ReqExt extends Req = Req, ResExt extends Res = Res>(
      ...handlers: RequestHandler<ReqExt, ResExt>[]
    ): this;
    patch<ReqExt extends Req = Req, ResExt extends Res = Res>(
      pattern: string | RegExp,
      ...handlers: RequestHandler<ReqExt, ResExt>[]
    ): this;

    run(req: Req, res: Res): Promise<void>;

    handle(req: Req, res: Res, done: NextHandler): void;
  }

  export default function <Req = IncomingMessage, Res = ServerResponse>(
    options?: Options<Req, Res>
  ): NextConnect<Req, Res>;
}
