declare module "next-connect" {
  import { NextApiRequest, NextApiResponse } from "next";

  type IncomingMessage = NextApiRequest;
  type ServerResponse = NextApiResponse;

  type NextHandler = (err?: any) => void;
  type Middleware = NextConnect | RequestHandler;

  type RequestHandler = (
    req: IncomingMessage,
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

    use(...handlers: Middleware[]): this;
    use(pattern: string | RegExp, ...handlers: Middleware[]): this;

    get(...handlers: RequestHandler[]): this;
    get(pattern: string | RegExp, ...handlers: RequestHandler[]): this;

    head(...handlers: RequestHandler[]): this;
    head(pattern: string | RegExp, ...handlers: RequestHandler[]): this;

    post(...handlers: RequestHandler[]): this;
    post(pattern: string | RegExp, ...handlers: RequestHandler[]): this;

    put(...handlers: RequestHandler[]): this;
    put(pattern: string | RegExp, ...handlers: RequestHandler[]): this;

    delete(...handlers: RequestHandler[]): this;
    delete(pattern: string | RegExp, ...handlers: RequestHandler[]): this;

    options(...handlers: RequestHandler[]): this;
    options(pattern: string | RegExp, ...handlers: RequestHandler[]): this;

    trace(...handlers: RequestHandler[]): this;
    trace(pattern: string | RegExp, ...handlers: RequestHandler[]): this;

    patch(...handlers: RequestHandler[]): this;
    patch(pattern: string | RegExp, ...handlers: RequestHandler[]): this;

    apply(req: IncomingMessage, res: ServerResponse): Promise<void>;

    handle(req: IncomingMessage, res: ServerResponse, done: NextHandler): void;
  }

  export default function (options?: Options): NextConnect;
}
