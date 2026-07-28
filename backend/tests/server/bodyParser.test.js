import { describe, it, expect, jest } from '@jest/globals';
import { EventEmitter } from 'node:events';
import { bodyParser } from '../../src/server/bodyParser.js';

/**
 * Create a stream-based request for bodyParser testing.
 */
function createStreamRequest(method = 'POST', path = '/', contentType = 'application/json') {
  const req = new EventEmitter();
  req.method = method;
  req.url = path;
  req.path = path;
  req.headers = { 'content-type': contentType };
  req.body = undefined;
  req.destroy = jest.fn();
  return req;
}

function createMockResponse() {
  const res = {
    statusCode: 200,
    error: jest.fn(),
    json: jest.fn(),
  };
  return res;
}

describe('bodyParser', () => {
  it('parses a valid JSON body', (done) => {
    const req = createStreamRequest('POST', '/test');
    const res = createMockResponse();
    const parser = bodyParser();

    parser(req, res, () => {
      expect(req.body).toEqual({ name: 'test', value: 42 });
      expect(res.error).not.toHaveBeenCalled();
      done();
    });

    req.emit('data', Buffer.from(JSON.stringify({ name: 'test', value: 42 })));
    req.emit('end');
  });

  it('parses JSON body split across multiple chunks', (done) => {
    const req = createStreamRequest('POST', '/test');
    const res = createMockResponse();
    const parser = bodyParser();

    parser(req, res, () => {
      expect(req.body).toEqual({ hello: 'world' });
      done();
    });

    req.emit('data', Buffer.from('{"hel'));
    req.emit('data', Buffer.from('lo":"world"}'));
    req.emit('end');
  });

  it('sets req.body to {} for empty JSON body', (done) => {
    const req = createStreamRequest('POST', '/test');
    const res = createMockResponse();
    const parser = bodyParser();

    parser(req, res, () => {
      expect(req.body).toEqual({});
      done();
    });

    req.emit('data', Buffer.from(''));
    req.emit('end');
  });

  it('sets req.body to {} for whitespace-only body', (done) => {
    const req = createStreamRequest('POST', '/test');
    const res = createMockResponse();
    const parser = bodyParser();

    parser(req, res, () => {
      expect(req.body).toEqual({});
      done();
    });

    req.emit('data', Buffer.from('   \n  \t  '));
    req.emit('end');
  });

  it('skips parsing for non-JSON content types', (done) => {
    const req = createStreamRequest('POST', '/test', 'text/plain');
    const res = createMockResponse();
    const parser = bodyParser();

    parser(req, res, (err) => {
      expect(err).toBeUndefined();
      expect(req.body).toBeUndefined();
      done();
    });

    // Should not have attached data/end listeners that would interfere
    expect(req.listeners('data').length).toBe(0);
    req.emit('end');
  });

  it('skips parsing for GET requests', (done) => {
    const req = createStreamRequest('GET', '/test');
    const res = createMockResponse();
    const parser = bodyParser();

    parser(req, res, () => {
      expect(req.body).toBeUndefined();
      done();
    });
  });

  it('skips parsing for DELETE requests', (done) => {
    const req = createStreamRequest('DELETE', '/test');
    const res = createMockResponse();
    const parser = bodyParser();

    parser(req, res, () => {
      expect(req.body).toBeUndefined();
      done();
    });
  });

  it('returns 400 for malformed JSON', () => {
    const req = createStreamRequest('POST', '/test');
    const res = createMockResponse();
    const parser = bodyParser();

    parser(req, res, () => {
      // next should not be called on parse error
      expect(true).toBe(false); // fail if we reach here
    });

    req.emit('data', Buffer.from('{ invalid json }'));
    req.emit('end');

    expect(res.error).toHaveBeenCalledWith('INVALID_JSON', 'Malformed JSON in request body', 400);
  });

  it('returns 413 for oversized body', () => {
    const req = createStreamRequest('POST', '/test');
    const res = createMockResponse();
    const parser = bodyParser();

    const nextSpy = jest.fn();
    parser(req, res, nextSpy);

    // Send data just over 1MB limit — in real HTTP, req.destroy() prevents 'end'
    const bigChunk = Buffer.alloc(2 * 1024 * 1024); // 2MB
    req.emit('data', bigChunk);

    expect(res.error).toHaveBeenCalledWith('PAYLOAD_TOO_LARGE', 'Request body exceeds 1MB limit', 413);
    expect(req.destroy).toHaveBeenCalled();
    expect(nextSpy).not.toHaveBeenCalled();
  });

  it('returns 500 on stream error', () => {
    const req = createStreamRequest('POST', '/test');
    const res = createMockResponse();
    const parser = bodyParser();

    parser(req, res, () => {
      expect(true).toBe(false);
    });

    req.emit('error', new Error('stream error'));

    expect(res.error).toHaveBeenCalledWith('INTERNAL_ERROR', 'Error reading request body', 500);
  });

  it('handles content-type with charset parameter', (done) => {
    const req = createStreamRequest('POST', '/test', 'application/json; charset=utf-8');
    const res = createMockResponse();
    const parser = bodyParser();

    parser(req, res, () => {
      expect(req.body).toEqual({ key: 'value' });
      done();
    });

    req.emit('data', Buffer.from('{"key":"value"}'));
    req.emit('end');
  });
});
