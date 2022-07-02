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
  method: HttpMethod | "";
  fns: H[];
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
  routes: Route<Nextable<H>>[];
  constructor() {
    this.routes = [];
  }
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

  public use(base: RouteMatch | Nextable<H>, ...fns: Nextable<H>[]) {
    if (typeof base === "function") {
      fns.unshift(base);
      base = "/";
    }
    const { keys, pattern } = parse(base, true);
    this.routes.push({ keys, pattern, method: "", fns, isMiddle: true });
    return this;
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
        fns.push(...route.fns);
        if (!route.isMiddle) middleOnly = false;
      }
    }
    return { fns, params, middleOnly };
  }
}
