export class Router {
  constructor() {
    this.routes = [];
  }

  get(path, middlewares, handler) {
    this._addRoute('GET', path, middlewares, handler);
    return this;
  }

  post(path, middlewares, handler) {
    this._addRoute('POST', path, middlewares, handler);
    return this;
  }

  put(path, middlewares, handler) {
    this._addRoute('PUT', path, middlewares, handler);
    return this;
  }

  delete(path, middlewares, handler) {
    this._addRoute('DELETE', path, middlewares, handler);
    return this;
  }

  patch(path, middlewares, handler) {
    this._addRoute('PATCH', path, middlewares, handler);
    return this;
  }

  _addRoute(method, path, middlewares, handler) {
    if (handler === undefined) {
      handler = middlewares;
      middlewares = [];
    }

    const paramNames = [];
    const regexStr = path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });

    const regex = new RegExp(`^${regexStr}$`);

    this.routes.push({ method, path, regex, paramNames, middlewares, handler });
  }

  match(method, pathname) {
    for (const route of this.routes) {
      if (route.method !== method) continue;
      const match = route.regex.exec(pathname);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, i) => {
          params[name] = decodeURIComponent(match[i + 1]);
        });
        return { handler: route.handler, params, middlewares: route.middlewares };
      }
    }
    return null;
  }
}
