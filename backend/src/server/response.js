import fs from 'node:fs';

export function attachResponseHelpers(req, res) {
  res.json = (data, statusCode = 200) => {
    const body = JSON.stringify(data);
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(body);
  };

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

  res.error = (code, message, statusCode = 500, details) => {
    const body = { error: { code, message } };
    if (details) body.error.details = details;
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  };

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
