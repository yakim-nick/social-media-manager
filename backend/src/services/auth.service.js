import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';

const SALT_ROUNDS = 12;

/**
 * Hash a plaintext password using bcrypt.
 *
 * @param {string} password - Plaintext password.
 * @returns {Promise<string>} Bcrypt hash.
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plaintext password against a bcrypt hash.
 *
 * @param {string} password - Plaintext password to check.
 * @param {string} hash - Stored bcrypt hash.
 * @returns {Promise<boolean>} True when the password matches the hash.
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Sign a JWT for the given payload using the configured secret and expiry.
 *
 * @param {object} payload - Claims to embed in the token.
 * @returns {string} Signed JWT.
 */
export function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

/**
 * Verify a JWT's signature and expiry.
 *
 * @param {string} token - JWT to verify.
 * @returns {object} Decoded payload.
 * @throws {Error} When the token is invalid or expired.
 */
export function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}