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

    use<T = {}, S = {}>(...handlers: Middleware<TT & T, SS & S>[]): this;
    use<T = {}, S = {}>(pattern: string | RegExp, ...handlers: Middleware<TT & T, SS & S>[]): this;

    get<T = {}, S = {}>(...handlers: RequestHandler<TT & T, SS & S>[]): this;
    get<T = {}, S = {}>(pattern: string | RegExp, ...handlers: RequestHandler<TT & T, SS & S>[]): this;

    head<T = {}, S = {}>(...handlers: RequestHandler<TT & T, SS & S>[]): this;
    head<T = {}, S = {}>(pattern: string | RegExp, ...handlers: RequestHandler<TT & T, SS & S>[]): this;

    post<T = {}, S = {}>(...handlers: RequestHandler<TT & T, SS & S>[]): this;
    post<T = {}, S = {}>(pattern: string | RegExp, ...handlers: RequestHandler<TT & T, SS & S>[]): this;

    put<T = {}, S = {}>(...handlers: RequestHandler<TT & T, SS & S>[]): this;
    put<T = {}, S = {}>(pattern: string | RegExp, ...handlers: RequestHandler<TT & T, SS & S>[]): this;

    delete<T = {}, S = {}>(...handlers: RequestHandler<TT & T, SS & S>[]): this;
    delete<T = {}, S = {}>(pattern: string | RegExp, ...handlers: RequestHandler<TT & T, SS & S>[]): this;

    options<T = {}, S = {}>(...handlers: RequestHandler<TT & T, SS & S>[]): this;
    options<T = {}, S = {}>(pattern: string | RegExp, ...handlers: RequestHandler<TT & T, SS & S>[]): this;

    trace<T = {}, S = {}>(...handlers: RequestHandler<TT & T, SS & S>[]): this;
    trace<T = {}, S = {}>(pattern: string | RegExp, ...handlers: RequestHandler<TT & T, SS & S>[]): this;

    patch<T = {}, S = {}>(...handlers: RequestHandler<TT & T, SS & S>[]): this;
    patch<T = {}, S = {}>(pattern: string | RegExp, ...handlers: RequestHandler<TT & T, SS & S>[]): this;

    apply(req: TT, res: SS): Promise<void>;

    handle(req: TT, res: SS, done: NextHandler): void;
  }

  export default function <T = IncomingMessage, S = ServerResponse>(options?: Options<T, S>): NextConnect<T, S>;
}
