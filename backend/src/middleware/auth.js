import prisma from '../utils/prisma.js';
import { verifyToken } from '../services/auth.service.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

/**
 * Middleware that authenticates a request via a `Bearer` token.
 *
 * Verifies the JWT signature, then checks that a matching, unexpired session
 * still exists in the database. On success the resolved user is attached to
 * `req.user` and the raw token to `req.token`.
 *
 * @param {import('node:http').IncomingMessage} req - Incoming request.
 * @param {import('node:http').ServerResponse} res - Server response.
 * @param {Function} next - Next middleware in the chain.
 */
export async function requireAuth(req, res, next) {
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }

    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            shopId: true,
            avatar: true,
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedError('Session expired or revoked');
    }

    req.user = session.user;
    req.token = token;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware factory that restricts a route to users holding one of the
 * given roles.
 *
 * @param {...string} roles - Roles allowed to access the route.
 * @returns {Function} Express-style middleware `(req, res, next)`.
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Requires one of roles: ${roles.join(', ')}`));
    }

    next();
  };
}

/**
 * Extract the token from an `Authorization: Bearer <token>` header.
 *
 * @param {string|undefined} authorizationHeader - Raw Authorization header.
 * @returns {string|null} The bearer token, or null when the header is absent
 *   or does not use the Bearer scheme.
 */
function extractBearerToken(authorizationHeader) {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return null;
  }
  return authorizationHeader.slice(7);
}