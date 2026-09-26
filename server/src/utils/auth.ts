import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AppError } from '../middleware/errorHandler';

export interface UserTokenPayload {
  id: string;
  email: string;
  role: 'ADMIN' | 'CUSTOMER';
}

const SALT_ROUNDS = 12;

/**
 * Securely hash a plaintext password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plaintext password with a bcrypt hash in constant-time
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a signed JWT token
 */
export function generateToken(payload: UserTokenPayload): string {
  return jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256',
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): UserTokenPayload {
  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret, {
      algorithms: ['HS256'],
    });
    return decoded as UserTokenPayload;
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Authentication token has expired. Please sign in again.', 401);
    }
    throw new AppError('Invalid authentication token.', 401);
  }
}
