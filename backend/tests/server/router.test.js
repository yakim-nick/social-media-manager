import { describe, it, expect } from '@jest/globals';
import { Router } from '../../src/server/router.js';

describe('Router', () => {
  let router;

  beforeEach(() => {
    router = new Router();
  });

  describe('route registration', () => {
    it('registers a GET route and matches it', () => {
      const handler = () => {};
      router.get('/api/v1/health', handler);
      const result = router.match('GET', '/api/v1/health');
      expect(result).not.toBeNull();
      expect(result.handler).toBe(handler);
      expect(result.params).toEqual({});
    });

    it('registers a POST route and matches it', () => {
      const handler = () => {};
      router.post('/api/v1/auth/login', handler);
      const result = router.match('POST', '/api/v1/auth/login');
      expect(result).not.toBeNull();
      expect(result.handler).toBe(handler);
    });

    it('registers a PUT route and matches it', () => {
      const handler = () => {};
      router.put('/api/v1/shops/:id', handler);
      const result = router.match('PUT', '/api/v1/shops/abc-123');
      expect(result).not.toBeNull();
    });

    it('registers a DELETE route and matches it', () => {
      const handler = () => {};
      router.delete('/api/v1/posts/:id', handler);
      const result = router.match('DELETE', '/api/v1/posts/post-1');
      expect(result).not.toBeNull();
    });

    it('registers a PATCH route and matches it', () => {
      const handler = () => {};
      router.patch('/api/v1/posts/:id', handler);
      const result = router.match('PATCH', '/api/v1/posts/post-1');
      expect(result).not.toBeNull();
    });
  });

  describe('path matching with params', () => {
    it('extracts named params from the path', () => {
      const handler = () => {};
      router.get('/api/v1/shops/:id', handler);
      const result = router.match('GET', '/api/v1/shops/shop-123');
      expect(result).not.toBeNull();
      expect(result.params).toEqual({ id: 'shop-123' });
    });

    it('extracts multiple params', () => {
      const handler = () => {};
      router.get('/api/v1/shops/:shopId/posts/:postId', handler);
      const result = router.match('GET', '/api/v1/shops/s1/posts/p99');
      expect(result).not.toBeNull();
      expect(result.params).toEqual({ shopId: 's1', postId: 'p99' });
    });

    it('decodes URI-encoded param values', () => {
      const handler = () => {};
      router.get('/items/:name', handler);
      const result = router.match('GET', '/items/hello%20world');
      expect(result).not.toBeNull();
      expect(result.params).toEqual({ name: 'hello world' });
    });

    it('returns null when param segment is missing', () => {
      const handler = () => {};
      router.get('/api/v1/shops/:id', handler);
      const result = router.match('GET', '/api/v1/shops/');
      expect(result).toBeNull();
    });
  });

  describe('method mismatch', () => {
    it('returns null when method does not match', () => {
      const handler = () => {};
      router.get('/api/v1/health', handler);
      const result = router.match('POST', '/api/v1/health');
      expect(result).toBeNull();
    });

    it('returns null when path matches but method is wrong', () => {
      const handler = () => {};
      router.post('/api/v1/auth/login', handler);
      const result = router.match('GET', '/api/v1/auth/login');
      expect(result).toBeNull();
    });
  });

  describe('no routes', () => {
    it('returns null when no routes are registered', () => {
      const result = router.match('GET', '/any/path');
      expect(result).toBeNull();
    });
  });

  describe('middlewares', () => {
    it('stores middlewares with the route', () => {
      const mw1 = () => {};
      const mw2 = () => {};
      const handler = () => {};
      router.get('/secure', [mw1, mw2], handler);

      const result = router.match('GET', '/secure');
      expect(result).not.toBeNull();
      expect(result.middlewares).toHaveLength(2);
      expect(result.middlewares[0]).toBe(mw1);
      expect(result.middlewares[1]).toBe(mw2);
      expect(result.handler).toBe(handler);
    });

    it('handles route with no middlewares (handler only)', () => {
      const handler = () => {};
      router.get('/simple', handler);

      const result = router.match('GET', '/simple');
      expect(result).not.toBeNull();
      expect(result.middlewares).toEqual([]);
      expect(result.handler).toBe(handler);
    });
  });

  describe('return this (chaining)', () => {
    it('allows chaining route registrations', () => {
      const handler = () => {};
      router
        .get('/a', handler)
        .post('/b', handler)
        .put('/c', handler);

      expect(router.match('GET', '/a')).not.toBeNull();
      expect(router.match('POST', '/b')).not.toBeNull();
      expect(router.match('PUT', '/c')).not.toBeNull();
    });
  });
});
