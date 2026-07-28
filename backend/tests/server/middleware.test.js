import { describe, it, expect, jest } from '@jest/globals';
import { compose } from '../../src/server/middleware.js';

describe('compose', () => {
  it('chains middleware in order', (done) => {
    const calls = [];
    const middlewares = [
      (req, res, next) => { calls.push(1); next(); },
      (req, res, next) => { calls.push(2); next(); },
      (req, res, next) => { calls.push(3); next(); },
    ];

    compose(middlewares)({}, {}, (err) => {
      expect(err).toBeUndefined();
      expect(calls).toEqual([1, 2, 3]);
      done();
    });
  });

  it('passes req and res through the chain', (done) => {
    const req = { id: 1 };
    const res = { id: 2 };

    compose([
      (rq, rs, next) => {
        expect(rq).toBe(req);
        expect(rs).toBe(res);
        next();
      },
      (rq, rs, next) => {
        expect(rq).toBe(req);
        expect(rs).toBe(res);
        next();
      },
    ])(req, res, (err) => {
      expect(err).toBeUndefined();
      done();
    });
  });

  it('calls the done callback when all middleware complete', (done) => {
    compose([])({}, {}, (err) => {
      expect(err).toBeUndefined();
      done();
    });
  });

  it('calls done with no arguments when no error occurs', (done) => {
    compose([(req, res, next) => next()])({}, {}, (err) => {
      expect(err).toBeUndefined();
      done();
    });
  });

  describe('error handling', () => {
    it('catches sync thrown errors and passes them to done', (done) => {
      compose([
        () => { throw new Error('sync fail'); },
      ])({}, {}, (err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe('sync fail');
        done();
      });
    });

    it('passes async errors via next(err) to done', (done) => {
      compose([
        (req, res, next) => next(new Error('async fail')),
      ])({}, {}, (err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe('async fail');
        done();
      });
    });

    it('stops normal middleware execution after an error', (done) => {
      const calls = [];
      compose([
        (req, res, next) => { calls.push(1); next(new Error('fail')); },
        (req, res, next) => { calls.push(2); next(); },
      ])({}, {}, (err) => {
        expect(err).toBeInstanceOf(Error);
        expect(calls).toEqual([1]);
        done();
      });
    });

    it('calls error middleware (arity 4) when an error occurs', (done) => {
      const errorHandler = jest.fn((err, req, res, next) => {
        next(); // error handled
      });

      compose([
        (req, res, next) => next(new Error('fail')),
        errorHandler,
      ])({}, {}, (err) => {
        expect(err).toBeUndefined(); // error was swallowed
        expect(errorHandler).toHaveBeenCalledTimes(1);
        expect(errorHandler.mock.calls[0][0].message).toBe('fail');
        done();
      });
    });

    it('skips error middleware in normal flow (no error)', (done) => {
      const errorHandler = jest.fn((err, req, res, next) => {
        next();
      });

      compose([
        (req, res, next) => next(),
        errorHandler,
        (req, res, next) => next(),
      ])({}, {}, (err) => {
        expect(err).toBeUndefined();
        expect(errorHandler).not.toHaveBeenCalled();
        done();
      });
    });

    it('no error middleware falls through to done with error', (done) => {
      compose([
        (req, res, next) => next(new Error('unhandled')),
      ])({}, {}, (err) => {
        expect(err.message).toBe('unhandled');
        done();
      });
    });
  });

  describe('middleware arity', () => {
    it('skips 4-arity middleware during normal flow', (done) => {
      const mw = jest.fn((err, req, res, next) => {});
      compose([mw, (req, res, next) => next()])({}, {}, (err) => {
        expect(err).toBeUndefined();
        expect(mw).not.toHaveBeenCalled();
        done();
      });
    });
  });
});
