import fs from 'node:fs';

/**
 * Attach convenience response helpers (`json`, `paginated`, `error`,
 * `sendFile`) to the raw Node.js ServerResponse object.
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response to augment.
 */
export function attachResponseHelpers(req, res) {
  /**
   * Send a JSON response with the given status code.
   * @param {*} data - Payload to serialize as JSON.
   * @param {number} [statusCode=200] - HTTP status code.
   */
  res.json = (data, statusCode = 200) => {
    const body = JSON.stringify(data);
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(body);
  };

  /**
   * Send a paginated list response with pagination metadata.
   * @param {Array} data - Items for the current page.
   * @param {number} total - Total number of matching items.
   * @param {number} page - Current page number (1-based).
   * @param {number} limit - Maximum items per page.
   */
  res.paginated = (data, total, page, limit) => {
    const totalPages = Math.ceil(total / limit);
    res.json({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  };

  /**
   * Send a structured error response.
   * @param {string} code - Machine-readable error code.
   * @param {string} message - Human-readable error message.
   * @param {number} [statusCode=500] - HTTP status code.
   * @param {*} [details] - Optional extra error details.
   */
  res.error = (code, message, statusCode = 500, details) => {
    const body = { error: { code, message } };
    if (details) body.error.details = details;
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  };

  /**
   * Stream a file from disk as the response body.
   * Responds with 404 when the file does not exist and 500 on read errors.
   * @param {string} filePath - Absolute path to the file.
   * @param {string} mimeType - Content-Type header value.
   */
  res.sendFile = (filePath, mimeType) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        res.error('NOT_FOUND', 'File not found', 404);
        return;
      }

      const stream = fs.createReadStream(filePath);
      res.writeHead(200, { 'Content-Type': mimeType });
      stream.pipe(res);

      stream.on('error', () => {
        res.error('INTERNAL_ERROR', 'Error reading file', 500);
      });
    });
  };
}