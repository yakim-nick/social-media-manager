const MAX_BODY_SIZE = 1 * 1024 * 1024; // 1MB

/**
 * Middleware factory that parses JSON request bodies into `req.body`.
 *
 * Only JSON content types on methods that may carry a body are parsed.
 * Oversized bodies are rejected with 413, malformed JSON with 400, and
 * stream errors with 500.
 *
 * @returns {Function} Express-style middleware `(req, res, next)`.
 */
export function bodyParser() {
  return (req, res, next) => {
    if (!shouldParseBody(req)) {
      return next();
    }

    const bodyChunks = [];
    let totalBytes = 0;

    req.on('data', (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > MAX_BODY_SIZE) {
        res.error('PAYLOAD_TOO_LARGE', 'Request body exceeds 1MB limit', 413);
        req.destroy();
        return;
      }
      bodyChunks.push(chunk);
    });

    req.on('end', () => {
      const rawBody = Buffer.concat(bodyChunks).toString('utf-8');

      // Treat an empty body as an empty object rather than a parse error.
      if (!rawBody.trim()) {
        req.body = {};
        return next();
      }

      try {
        req.body = JSON.parse(rawBody);
        next();
      } catch (parseError) {
        res.error('INVALID_JSON', 'Malformed JSON in request body', 400);
      }
    });

    req.on('error', () => {
      res.error('INTERNAL_ERROR', 'Error reading request body', 500);
    });
  };
}

/**
 * Decide whether a request may carry a JSON body worth parsing.
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @returns {boolean} True when the request is JSON with a body-capable method.
 */
function shouldParseBody(req) {
  const contentType = req.headers['content-type'] || '';

  if (!contentType.includes('application/json')) {
    return false;
  }

  // GET/HEAD/DELETE requests never carry a meaningful body.
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'DELETE') {
    return false;
  }

  return true;
}