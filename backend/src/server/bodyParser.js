const MAX_BODY_SIZE = 1 * 1024 * 1024; // 1MB

export function bodyParser() {
  return (req, res, next) => {
    const contentType = req.headers['content-type'] || '';

    if (!contentType.includes('application/json')) {
      return next();
    }

    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'DELETE') {
      return next();
    }

    const chunks = [];
    let totalSize = 0;

    req.on('data', (chunk) => {
      totalSize += chunk.length;
      if (totalSize > MAX_BODY_SIZE) {
        res.error('PAYLOAD_TOO_LARGE', 'Request body exceeds 1MB limit', 413);
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf-8');

      if (!raw.trim()) {
        req.body = {};
        return next();
      }

      try {
        req.body = JSON.parse(raw);
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
