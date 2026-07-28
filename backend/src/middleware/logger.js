const isDev = process.env.NODE_ENV !== 'production';

const COLORS = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
};

function statusColor(status) {
  if (status < 300) return COLORS.green;
  if (status < 400) return COLORS.cyan;
  if (status < 500) return COLORS.yellow;
  return COLORS.red;
}

export function logger() {
  return (req, res, next) => {
    const start = Date.now();

    res.once('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;

      if (isDev) {
        const color = statusColor(status);
        console.log(
          `${COLORS.dim}[${new Date().toISOString()}]${COLORS.reset} ` +
          `${COLORS.cyan}${req.method}${COLORS.reset} ` +
          `${req.path} ` +
          `${color}${status}${COLORS.reset} ` +
          `${COLORS.dim}${duration}ms${COLORS.reset}`
        );
      } else {
        console.log(`${req.method} ${req.path} ${status} ${duration}ms`);
      }
    });

    next();
  };
}
