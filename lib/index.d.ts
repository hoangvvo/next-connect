
declare module "next-connect" {
  import { NextApiRequest, NextApiResponse } from "next";

  type IncomingMessage = NextApiRequest;
  type ServerResponse = NextApiResponse;

  type NextHandler = (err?: any) => void;
  type Middleware<T = {}> = NextConnect | RequestHandler<T>;

  type RequestHandler<T = {}> = (
    req: IncomingMessage & T,
    res: ServerResponse,
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
    use<T>(pattern: string | RegExp, ...handlers: Middleware<T>[]): this;

    get<T>(...handlers: RequestHandler<T>[]): this;
    get<T>(pattern: string | RegExp, ...handlers: RequestHandler<T>[]): this;

    head<T>(...handlers: RequestHandler<T>[]): this;
    head<T>(pattern: string | RegExp, ...handlers: RequestHandler<T>[]): this;

    post<T>(...handlers: RequestHandler<T>[]): this;
    post<T>(pattern: string | RegExp, ...handlers: RequestHandler<T>[]): this;

    put<T>(...handlers: RequestHandler<T>[]): this;
    put<T>(pattern: string | RegExp, ...handlers: RequestHandler<T>[]): this;

    delete<T>(...handlers: RequestHandler<T>[]): this;
    delete<T>(pattern: string | RegExp, ...handlers: RequestHandler<T>[]): this;

    options<T>(...handlers: RequestHandler<T>[]): this;
    options<T>(pattern: string | RegExp, ...handlers: RequestHandler<T>[]): this;

    trace<T>(...handlers: RequestHandler<T>[]): this;
    trace<T>(pattern: string | RegExp, ...handlers: RequestHandler<T>[]): this;

    patch<T>(...handlers: RequestHandler<T>[]): this;
    patch<T>(pattern: string | RegExp, ...handlers: RequestHandler<T>[]): this;

    apply(req: IncomingMessage, res: ServerResponse): Promise<void>;

    handle(req: IncomingMessage, res: ServerResponse, done: NextHandler): void;
  }

  export default function (options?: Options): NextConnect;
}
