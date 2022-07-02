declare module "regexparam" {
  export function parse(
    route: string | RegExp,
    loose?: boolean
  ): {
    keys: string[] | false;
    pattern: RegExp;
  };
}
