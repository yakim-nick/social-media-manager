import config from '../config/index.js';

const hits = new Map();

const CLEANUP_INTERVAL = 60000;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of hits) {
    if (now - entry.start > config.rateLimit.windowMs) {
      hits.delete(key);
    }
  }
}, CLEANUP_INTERVAL).unref();

export function rateLimiter() {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.socket.remoteAddress
      || 'unknown';

    const now = Date.now();
    let entry = hits.get(ip);

    if (!entry || now - entry.start > config.rateLimit.windowMs) {
      entry = { start: now, count: 0 };
      hits.set(ip, entry);
    }

    entry.count += 1;

    res.setHeader('X-RateLimit-Limit', config.rateLimit.max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, config.rateLimit.max - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil((entry.start + config.rateLimit.windowMs) / 1000));

    if (entry.count > config.rateLimit.max) {
      res.error('RATE_LIMIT_EXCEEDED', 'Too many requests, please try again later', 429);
      return;
    }

    next();
  };
}
