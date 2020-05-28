
declare module "next-connect" {
  import { NextApiRequest, NextApiResponse } from "next";

  type IncomingMessage = NextApiRequest;
  type ServerResponse = NextApiResponse;

  type NextHandler = (err?: any) => void;
  type Middleware<T = {}, S = {}> = NextConnect | RequestHandler<T, S>;

  type RequestHandler<T = {}, S = {}> = (
    req: IncomingMessage & T,
    res: ServerResponse & S,
    next: NextHandler
  ) => void;

  type ErrorHandler = (
    err: any,
    req: IncomingMessage,
    res: ServerResponse,
    next: NextHandler
  ) => void;

  interface Options {
    onError?: ErrorHandler;
    onNoMatch?: RequestHandler;
  }

  function NextConnect(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void>;

  interface NextConnect {
    readonly onError: ErrorHandler;
    readonly onNoMatch: RequestHandler;

    // no generic here as by my understanding it's not inferrable
    use(...handlers: Middleware[]): this;
    use<T, S>(pattern: string | RegExp, ...handlers: Middleware<T, S>[]): this;

    get<T, S>(...handlers: RequestHandler<T, S>[]): this;
    get<T, S>(pattern: string | RegExp, ...handlers: RequestHandler<T, S>[]): this;

    head<T, S>(...handlers: RequestHandler<T, S>[]): this;
    head<T, S>(pattern: string | RegExp, ...handlers: RequestHandler<T, S>[]): this;

    post<T, S>(...handlers: RequestHandler<T, S>[]): this;
    post<T, S>(pattern: string | RegExp, ...handlers: RequestHandler<T, S>[]): this;

    put<T, S>(...handlers: RequestHandler<T, S>[]): this;
    put<T, S>(pattern: string | RegExp, ...handlers: RequestHandler<T, S>[]): this;

    delete<T, S>(...handlers: RequestHandler<T, S>[]): this;
    delete<T, S>(pattern: string | RegExp, ...handlers: RequestHandler<T, S>[]): this;

    options<T, S>(...handlers: RequestHandler<T, S>[]): this;
    options<T, S>(pattern: string | RegExp, ...handlers: RequestHandler<T, S>[]): this;

    trace<T, S>(...handlers: RequestHandler<T, S>[]): this;
    trace<T, S>(pattern: string | RegExp, ...handlers: RequestHandler<T, S>[]): this;

    patch<T, S>(...handlers: RequestHandler<T, S>[]): this;
    patch<T, S>(pattern: string | RegExp, ...handlers: RequestHandler<T, S>[]): this;

    apply(req: IncomingMessage, res: ServerResponse): Promise<void>;

    handle(req: IncomingMessage, res: ServerResponse, done: NextHandler): void;
  }

  export default function (options?: Options): NextConnect;
}
