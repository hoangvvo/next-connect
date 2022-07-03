/**
 * Agnostic router class
 * Adapted from lukeed/trouter library:
 * https://github.com/lukeed/trouter/blob/master/index.mjs
 */
import { parse } from "regexparam";
import type {
  FindResult,
  FunctionLike,
  HttpMethod,
  Nextable,
  RouteMatch,
} from "./types.js";

export type Route<H> = {
  prefix?: string;
  method: HttpMethod | "";
  fns: (H | Router<H extends FunctionLike ? H : never>)[];
  isMiddle: boolean;
} & (
  | {
      keys: string[] | false;
      pattern: RegExp;
    }
  | { matchAll: true }
);

type RouteShortcutMethod<This, H extends FunctionLike> = (
  route: RouteMatch | Nextable<H>,
  ...fns: Nextable<H>[]
) => This;

export class Router<H extends FunctionLike> {
  constructor(
    public base: string = "/",
    public routes: Route<Nextable<H>>[] = []
  ) {}
  public add(
    method: HttpMethod | "",
    route: RouteMatch | Nextable<H>,
    ...fns: Nextable<H>[]
  ): this {
    if (typeof route === "function") {
      fns.unshift(route);
      route = "";
    }
    if (route === "")
      this.routes.push({ matchAll: true, method, fns, isMiddle: false });
    else {
      const { keys, pattern } = parse(route);
      this.routes.push({ keys, pattern, method, fns, isMiddle: false });
    }
    return this;
  }
  public all: RouteShortcutMethod<this, H> = this.add.bind(this, "");
  public get: RouteShortcutMethod<this, H> = this.add.bind(this, "GET");
  public head: RouteShortcutMethod<this, H> = this.add.bind(this, "HEAD");
  public post: RouteShortcutMethod<this, H> = this.add.bind(this, "POST");
  public put: RouteShortcutMethod<this, H> = this.add.bind(this, "PUT");
  public patch: RouteShortcutMethod<this, H> = this.add.bind(this, "PATCH");
  public delete: RouteShortcutMethod<this, H> = this.add.bind(this, "DELETE");

  public use(
    base: RouteMatch | Nextable<H> | Router<H>,
    ...fns: (Nextable<H> | Router<H>)[]
  ) {
    if (typeof base === "function" || base instanceof Router) {
      fns.unshift(base);
      base = "/";
    }
    // mount subrouter
    fns = fns.map((fn) => {
      if (fn instanceof Router) {
        if (typeof base === "string") return fn.clone(base);
        throw new Error("Mounting a router to RegExp base is not supported");
      }
      return fn;
    });
    const { keys, pattern } = parse(base, true);
    this.routes.push({ keys, pattern, method: "", fns, isMiddle: true });
    return this;
  }

  public clone(base?: string) {
    return new Router<H>(base, Array.from(this.routes));
  }

  static async exec<H extends FunctionLike>(
    fns: Nextable<H>[],
    ...args: Parameters<H>
  ): Promise<unknown> {
    let i = 0;
    const next = () => fns[++i](...args, next);
    return fns[i](...args, next);
  }

  find(method: HttpMethod, pathname: string): FindResult<H> {
    let middleOnly = true;
    const fns: Nextable<H>[] = [];
    const params: Record<string, string> = {};
    const isHead = method === "HEAD";
    for (const route of this.routes) {
      if (
        route.method !== method &&
        // matches any method
        route.method !== "" &&
        // The HEAD method requests that the target resource transfer a representation of its state, as for a GET request...
        !(isHead && route.method === "GET")
      ) {
        continue;
      }
      let matched = false;
      if ("matchAll" in route) {
        matched = true;
      } else {
        if (route.keys === false) {
          // routes.key is RegExp: https://github.com/lukeed/regexparam/blob/master/src/index.js#L2
          const matches = route.pattern.exec(pathname);
          if (matches === null) continue;
          if (matches.groups !== void 0)
            for (const k in matches.groups) params[k] = matches.groups[k];
          matched = true;
        } else if (route.keys.length > 0) {
          const matches = route.pattern.exec(pathname);
          if (matches === null) continue;
          for (let j = 0; j < route.keys.length; )
            params[route.keys[j]] = matches[++j];
          matched = true;
        } else if (route.pattern.test(pathname)) {
          matched = true;
        } // else not a match
      }
      if (matched) {
        fns.push(
          ...route.fns
            .map((fn) => {
              if (fn instanceof Router) {
                const base = fn.base as string;
                let stripPathname = pathname.substring(base.length);
                // fix stripped pathname, not sure why this happens
                if (stripPathname[0] != "/")
                  stripPathname = `/${stripPathname}`;
                const result = fn.find(method, stripPathname);
                if (!result.middleOnly) middleOnly = false;
                // merge params
                Object.assign(params, result.params);
                return result.fns;
              }
              return fn;
            })
            .flat()
        );
        if (!route.isMiddle) middleOnly = false;
      }
    }
    return { fns, params, middleOnly };
  }
}
