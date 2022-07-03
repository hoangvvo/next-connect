export type HttpMethod = "GET" | "HEAD" | "POST" | "PUT" | "PATCH" | "DELETE";

export type FunctionLike = (...args: any[]) => unknown;

export type RouteMatch = string | RegExp;

export type NextHandler = () => any | Promise<any>;

export type Nextable<H extends FunctionLike> = (
  ...args: [...Parameters<H>, NextHandler]
) => any | Promise<any>;

export type FindResult<H extends FunctionLike> = {
  fns: Nextable<H>[];
  params: Record<string, string>;
  middleOnly: boolean;
};

export interface HandlerOptions<Handler extends FunctionLike> {
  onNoMatch?: Handler;
  onError?: (err: unknown, ...args: Parameters<Handler>) => ReturnType<Handler>;
}

export interface NodeRouterOptions {
  attachParams?: boolean;
}
