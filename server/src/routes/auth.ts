import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../db/connection';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { comparePassword, generateToken, hashPassword } from '../utils/auth';
import { AppError } from '../middleware/errorHandler';

export const authRouter = Router();

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email address is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email address is required'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
  }),
});

/**
 * POST /api/v1/auth/register
 * Register a new customer user account and return signed JWT
 */
authRouter.post(
  '/register',
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      // 1. Check if user already exists
      const checkSql = `
        SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1;
      `;
      const { rows } = await query(checkSql, [normalizedEmail]);
      if (rows.length > 0) {
        throw new AppError('An account with this email address already exists. Please sign in instead.', 409);
      }

      // 2. Hash password securely
      const passwordHash = await hashPassword(password);
      const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // 3. Create customer user record
      const insertSql = `
        INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
        VALUES ($1, $2, $3, 'CUSTOMER', NOW(), NOW())
        RETURNING id, email, role, created_at;
      `;
      const insertRes = await query(insertSql, [userId, normalizedEmail, passwordHash]);
      const newUser = insertRes.rows[0];

      // 4. Issue JWT token
      const token = generateToken({
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      });

      res.status(201).json({
        message: 'Registration successful',
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.created_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/auth/login
 * Authenticate admin or customer user and return signed JWT
 */
authRouter.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      const userSql = `
        SELECT id, email, password_hash, role
        FROM users
        WHERE LOWER(email) = $1;
      `;
      const { rows } = await query(userSql, [normalizedEmail]);

      if (rows.length === 0) {
        // Safe generic message preventing email enumeration
        throw new AppError('Invalid email or password.', 401);
      }

      const user = rows[0];
      const isPasswordValid = await comparePassword(password, user.password_hash);

      if (!isPasswordValid) {
        throw new AppError('Invalid email or password.', 401);
      }

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      res.json({
        message: 'Authentication successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/auth/me
 * Get current authenticated user profile
 */
authRouter.get(
  '/me',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // req.user is populated by requireAuth middleware
      const user = req.user!;

      // Fetch fresh profile from database
      const userSql = `
        SELECT id, email, role, created_at
        FROM users
        WHERE id = $1;
      `;
      const { rows } = await query(userSql, [user.id]);

      if (rows.length === 0) {
        throw new AppError('User profile not found.', 404);
      }

      const current = rows[0];

      res.json({
        user: {
          id: current.id,
          email: current.email,
          role: current.role,
          createdAt: current.created_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);
