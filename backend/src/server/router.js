/**
 * Minimal HTTP router that registers routes by HTTP method and matches
 * incoming requests against compiled path patterns.
 *
 * Path parameters are declared with a `:name` segment (e.g. `/shops/:id`)
 * and are exposed on the matched result as decoded `params`.
 */
export class Router {
  constructor() {
    /** @type {Array<{method: string, path: string, regex: RegExp, paramNames: string[], middlewares: Function[], handler: Function}>} */
    this.routes = [];
  }

  /**
   * Register a GET route.
   * @param {string} path - Route path, may contain `:param` segments.
   * @param {Function[]} [middlewares] - Route-level middleware chain.
   * @param {Function} handler - Request handler `(req, res)`.
   * @returns {Router} This router, for chaining.
   */
  get(path, middlewares, handler) {
    this._addRoute('GET', path, middlewares, handler);
    return this;
  }

  /**
   * Register a POST route.
   * @param {string} path - Route path, may contain `:param` segments.
   * @param {Function[]} [middlewares] - Route-level middleware chain.
   * @param {Function} handler - Request handler `(req, res)`.
   * @returns {Router} This router, for chaining.
   */
  post(path, middlewares, handler) {
    this._addRoute('POST', path, middlewares, handler);
    return this;
  }

  /**
   * Register a PUT route.
   * @param {string} path - Route path, may contain `:param` segments.
   * @param {Function[]} [middlewares] - Route-level middleware chain.
   * @param {Function} handler - Request handler `(req, res)`.
   * @returns {Router} This router, for chaining.
   */
  put(path, middlewares, handler) {
    this._addRoute('PUT', path, middlewares, handler);
    return this;
  }

  /**
   * Register a DELETE route.
   * @param {string} path - Route path, may contain `:param` segments.
   * @param {Function[]} [middlewares] - Route-level middleware chain.
   * @param {Function} handler - Request handler `(req, res)`.
   * @returns {Router} This router, for chaining.
   */
  delete(path, middlewares, handler) {
    this._addRoute('DELETE', path, middlewares, handler);
    return this;
  }

  /**
   * Register a PATCH route.
   * @param {string} path - Route path, may contain `:param` segments.
   * @param {Function[]} [middlewares] - Route-level middleware chain.
   * @param {Function} handler - Request handler `(req, res)`.
   * @returns {Router} This router, for chaining.
   */
  patch(path, middlewares, handler) {
    this._addRoute('PATCH', path, middlewares, handler);
    return this;
  }

  /**
   * Store a route, compiling its path into a matching regular expression.
   *
   * When `handler` is the third argument, `middlewares` is treated as the
   * handler and the middleware list defaults to an empty array.
   *
   * @param {string} method - HTTP method (GET, POST, ...).
   * @param {string} path - Route path, may contain `:param` segments.
   * @param {Function[]} [middlewares] - Route-level middleware chain.
   * @param {Function} [handler] - Request handler `(req, res)`.
   */
  _addRoute(method, path, middlewares, handler) {
    if (handler === undefined) {
      handler = middlewares;
      middlewares = [];
    }

    const { regex, paramNames } = compilePathToRegex(path);

    this.routes.push({ method, path, regex, paramNames, middlewares, handler });
  }

  /**
   * Find the first registered route matching the given method and pathname.
   *
   * @param {string} method - HTTP method of the incoming request.
   * @param {string} pathname - URL pathname (without query string).
   * @returns {{handler: Function, params: object, middlewares: Function[]}|null}
   *   The matched route data, or null when nothing matches.
   */
  match(method, pathname) {
    for (const route of this.routes) {
      if (route.method !== method) continue;

      const match = route.regex.exec(pathname);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = decodeURIComponent(match[index + 1]);
        });
        return { handler: route.handler, params, middlewares: route.middlewares };
      }
    }
    return null;
  }
}

/**
 * Compile a route path into a regular expression plus the ordered list of
 * named parameters it declares.
 *
 * Each `:name` segment becomes a capture group matching any non-slash text.
 *
 * @param {string} path - Route path, may contain `:param` segments.
 * @returns {{regex: RegExp, paramNames: string[]}} Compiled matcher data.
 */
function compilePathToRegex(path) {
  const paramNames = [];
  const pattern = path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });

  return { regex: new RegExp(`^${pattern}$`), paramNames };
}