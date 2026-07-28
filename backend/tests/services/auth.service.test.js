import { describe, it, expect } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../../src/config/index.js';
import {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
} from '../../src/services/auth.service.js';

describe('auth service - hashPassword', () => {
  it('returns a string', async () => {
    const hash = await hashPassword('myPassword123');
    expect(typeof hash).toBe('string');
  });

  it('returns a bcrypt hash', async () => {
    const hash = await hashPassword('myPassword123');
    expect(hash).toMatch(/^\$2[ab]\$\d+\$/);
  });

  it('produces different hashes for the same password (salt)', async () => {
    const hash1 = await hashPassword('samePassword');
    const hash2 = await hashPassword('samePassword');
    expect(hash1).not.toBe(hash2);
  });

  it('produces a hash of reasonable length', async () => {
    const hash = await hashPassword('anyPassword');
    expect(hash.length).toBeGreaterThan(50);
    expect(hash.length).toBeLessThan(100);
  });

  it('handles empty password string', async () => {
    const hash = await hashPassword('');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });
});

describe('auth service - comparePassword', () => {
  it('returns true for matching password', async () => {
    const password = 'correct-horse-battery-staple';
    const hash = await hashPassword(password);
    const result = await comparePassword(password, hash);
    expect(result).toBe(true);
  });

  it('returns false for incorrect password', async () => {
    const hash = await hashPassword('the-real-password');
    const result = await comparePassword('wrong-password', hash);
    expect(result).toBe(false);
  });

  it('returns false when hash is from a different password', async () => {
    const hash = await hashPassword('password-a');
    const result = await comparePassword('password-b', hash);
    expect(result).toBe(false);
  });

  it('returns false for empty string vs non-empty password hash', async () => {
    const hash = await hashPassword('something');
    const result = await comparePassword('', hash);
    expect(result).toBe(false);
  });

  it('returns false for non-empty string vs empty password hash', async () => {
    const hash = await hashPassword('');
    const result = await comparePassword('something', hash);
    expect(result).toBe(false);
  });
});

describe('auth service - generateToken', () => {
  it('returns a JWT string', () => {
    const payload = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
    const token = generateToken(payload);
    expect(typeof token).toBe('string');
    // JWT has three dot-separated parts
    expect(token.split('.')).toHaveLength(3);
  });

  it('includes the payload data in the token', () => {
    const payload = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
    const token = generateToken(payload);
    const decoded = jwt.decode(token);
    expect(decoded.id).toBe('user-1');
    expect(decoded.email).toBe('test@example.com');
    expect(decoded.role).toBe('OWNER');
  });

  it('sets an expiration on the token', () => {
    const payload = { id: 'user-1' };
    const token = generateToken(payload);
    const decoded = jwt.decode(token);
    expect(decoded.exp).toBeDefined();
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('does not include sensitive fields if not in payload', () => {
    const payload = { id: 'user-1' };
    const token = generateToken(payload);
    const decoded = jwt.decode(token);
    expect(decoded).not.toHaveProperty('password');
    expect(decoded).not.toHaveProperty('hash');
  });
});

describe('auth service - verifyToken', () => {
  it('returns the decoded payload for a valid token', () => {
    const payload = { id: 'user-1', email: 'test@example.com', role: 'OWNER' };
    const token = generateToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.id).toBe('user-1');
    expect(decoded.email).toBe('test@example.com');
    expect(decoded.role).toBe('OWNER');
  });

  it('rejects a token signed with a different secret', () => {
    const token = jwt.sign({ id: 'user-1' }, 'wrong-secret');
    expect(() => verifyToken(token)).toThrow();
  });

  it('rejects an expired token', () => {
    const token = jwt.sign({ id: 'user-1' }, config.jwt.secret, { expiresIn: '0s' });
    // Wait a tick for the token to expire
    expect(() => verifyToken(token)).toThrow();
  });

  it('rejects a malformed token string', () => {
    expect(() => verifyToken('not-a-valid-jwt')).toThrow();
  });

  it('rejects an empty string', () => {
    expect(() => verifyToken('')).toThrow();
  });
});
