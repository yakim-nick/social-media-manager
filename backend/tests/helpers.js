import { EventEmitter } from 'node:events';
import jwt from 'jsonwebtoken';
import config from '../src/config/index.js';
import { jest } from '@jest/globals';

/**
 * Generate a real JWT for testing.
 * @param {object} user - User payload { id, email, role }
 * @returns {string} signed JWT
 */
export function generateTestToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: '1h' },
  );
}

/**
 * Create a minimal Node.js IncomingMessage-like object for tests.
 * For bodyParser tests use createStreamReq() instead.
 */
export function createTestReq(method = 'GET', path = '/', body = null, headers = {}) {
  return {
    method,
    url: path,
    path,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body,
    query: {},
    params: {},
    socket: { remoteAddress: '127.0.0.1' },
    token: null,
    user: null,
    on: jest.fn(),
    destroy: jest.fn(),
  };
}

/**
 * Create a request object that acts as a readable stream (for bodyParser tests).
 */
export function createStreamReq(method = 'POST', path = '/', headers = {}) {
  const req = new EventEmitter();
  req.method = method;
  req.url = path;
  req.path = path;
  req.headers = {
    'content-type': 'application/json',
    ...headers,
  };
  req.query = {};
  req.params = {};
  req.socket = { remoteAddress: '127.0.0.1' };
  req.destroy = jest.fn();
  req.body = undefined;
  return req;
}

/**
 * Create a ServerResponse-like object with jest.fn() spies.
 * Provides .json(), .error(), .paginated() helpers.
 */
export function createTestRes() {
  const res = {
    statusCode: 200,
    _headers: {},
    setHeader: jest.fn((key, value) => {
      res._headers[key] = value;
    }),
    writeHead: jest.fn(function (status, headers) {
      res.statusCode = status;
      if (headers) Object.assign(res._headers, headers);
    }),
    end: jest.fn(),
    once: jest.fn((event, cb) => {
      if (event === 'finish') {
        setImmediate(cb);
      }
    }),
    // response helpers from response.js
    json: jest.fn((data, statusCode = 200) => {
      res.statusCode = statusCode;
      res._jsonData = data;
    }),
    error: jest.fn((code, message, statusCode = 500, details) => {
      res.statusCode = statusCode;
      res._errorData = { code, message, details };
    }),
    paginated: jest.fn((data, total, page, limit) => {
      res.statusCode = 200;
      res._paginatedData = { data, total, page, limit };
    }),
  };
  return res;
}

/**
 * Create a fully mocked PrismaClient instance.
 * Every model method is a jest.fn().
 */
export function createMockPrisma() {
  return {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    session: {
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    shop: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    socialAccount: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    post: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    media: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    analytics: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    $disconnect: jest.fn().mockResolvedValue(undefined),
  };
}
