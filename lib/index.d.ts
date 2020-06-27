declare module "next-connect" {
  import { IncomingMessage, ServerResponse } from "http";

  type NextHandler = (err?: any) => void;
  type Middleware<T, S> = NextConnect<T, S> | RequestHandler<T, S>;

  type RequestHandler<T, S> = (
    req: T,
    res: S,
    next: NextHandler
  ) => void;

  type ErrorHandler<T, S> = (
    err: any,
    req: T,
    res: S,
    next: NextHandler
  ) => void;

  interface Options<T, S> {
    onError?: ErrorHandler<T, S>;
    onNoMatch?: RequestHandler<T, S>;
  }

  function NextConnect<TT, SS>(
    req: TT,
    res: SS
  ): Promise<void>;

  interface NextConnect<TT, SS> {
    readonly onError: ErrorHandler<TT, SS>;
    readonly onNoMatch: RequestHandler<TT, SS>;

    use<T = TT, S = SS>(...handlers: Middleware<TT & T, SS & S>[]): this;
    use<T = TT, S = SS>(pattern: string | RegExp, ...handlers: Middleware<TT & T, SS & S>[]): this;

    get<T = TT, S = SS>(...handlers: RequestHandler<TT & T, SS & S>[]): this;
    get<T = TT, S = SS>(pattern: string | RegExp, ...handlers: RequestHandler<TT & T, SS & S>[]): this;

    head<T = TT, S = SS>(...handlers: RequestHandler<TT & T, SS & S>[]): this;
    head<T = TT, S = SS>(pattern: string | RegExp, ...handlers: RequestHandler<TT & T, SS & S>[]): this;

    post<T = TT, S = SS>(...handlers: RequestHandler<TT & T, SS & S>[]): this;
    post<T = TT, S = SS>(pattern: string | RegExp, ...handlers: RequestHandler<TT & T, SS & S>[]): this;

    put<T = TT, S = SS>(...handlers: RequestHandler<TT & T, SS & S>[]): this;
    put<T = TT, S = SS>(pattern: string | RegExp, ...handlers: RequestHandler<TT & T, SS & S>[]): this;

    delete<T = TT, S = SS>(...handlers: RequestHandler<TT & T, SS & S>[]): this;
    delete<T = TT, S = SS>(pattern: string | RegExp, ...handlers: RequestHandler<TT & T, SS & S>[]): this;

    options<T = TT, S = SS>(...handlers: RequestHandler<TT & T, SS & S>[]): this;
    options<T = TT, S = SS>(pattern: string | RegExp, ...handlers: RequestHandler<TT & T, SS & S>[]): this;

    trace<T = TT, S = SS>(...handlers: RequestHandler<TT & T, SS & S>[]): this;
    trace<T = TT, S = SS>(pattern: string | RegExp, ...handlers: RequestHandler<TT & T, SS & S>[]): this;

    patch<T = TT, S = SS>(...handlers: RequestHandler<TT & T, SS & S>[]): this;
    patch<T = TT, S = SS>(pattern: string | RegExp, ...handlers: RequestHandler<TT & T, SS & S>[]): this;

    apply(req: TT, res: SS): Promise<void>;

    handle(req: TT, res: SS, done: NextHandler): void;
  }

  export default function <T = IncomingMessage, S = ServerResponse>(options?: Options<T, S>): NextConnect<T, S>;
}
