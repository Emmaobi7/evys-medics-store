import crypto from 'crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../db/connection';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { comparePassword, generateToken, hashPassword } from '../utils/auth';
import { sendPasswordResetEmail } from '../services/emailService';
import { config } from '../config/env';
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

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email address is required'),
    origin: z.string().url('Invalid origin format').optional(),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
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

/**
 * POST /api/v1/auth/forgot-password
 * Initiate password reset request and dispatch secure verification email
 */
authRouter.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, origin } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      // 1. Look up user
      const userRes = await query<any>(
        'SELECT id, email FROM users WHERE LOWER(email) = $1 LIMIT 1;',
        [normalizedEmail]
      );

      // Generic response message preventing account enumeration
      const genericMessage =
        'If an account is associated with this email address, password reset instructions have been dispatched.';

      if (userRes.rows.length === 0) {
        return res.status(200).json({ message: genericMessage });
      }

      const user = userRes.rows[0];

      // 2. Generate cryptographically secure token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

      // 3. Store hashed token in database
      await query(
        `
        INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used, created_at)
        VALUES ($1, $2, $3, FALSE, NOW());
        `,
        [user.id, tokenHash, expiresAt.toISOString()]
      );

      // 4. Construct reset URL
      const frontendBase =
        origin ||
        config.corsOrigins[0] ||
        'https://mason-appointments-wales-dayton.trycloudflare.com';
      const resetUrl = `${frontendBase}/reset-password?token=${rawToken}`;

      // 5. Asynchronously dispatch password reset email
      sendPasswordResetEmail(user.email, rawToken, resetUrl).catch((err) => {
        console.error('[Forgot Password Email Error]:', err.message);
      });

      res.status(200).json({ message: genericMessage });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/auth/reset-password
 * Verify reset token and set new password
 */
authRouter.post(
  '/reset-password',
  validate(resetPasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, newPassword } = req.body;
      const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

      // 1. Validate token
      const tokenRes = await query<any>(
        `
        SELECT id, user_id, expires_at, used
        FROM password_reset_tokens
        WHERE token_hash = $1
        LIMIT 1;
        `,
        [tokenHash]
      );

      if (tokenRes.rows.length === 0) {
        throw new AppError('Invalid or expired password reset link. Please request a new one.', 400);
      }

      const resetRecord = tokenRes.rows[0];

      if (resetRecord.used) {
        throw new AppError('This password reset link has already been used. Please request a new one.', 400);
      }

      if (new Date(resetRecord.expires_at) < new Date()) {
        throw new AppError('This password reset link has expired. Please request a new one.', 400);
      }

      // 2. Hash new password
      const passwordHash = await hashPassword(newPassword);

      // 3. Update user password
      await query(
        `
        UPDATE users
        SET password_hash = $1, updated_at = NOW()
        WHERE id = $2;
        `,
        [passwordHash, resetRecord.user_id]
      );

      // 4. Invalidate used token
      await query(
        `
        UPDATE password_reset_tokens
        SET used = TRUE
        WHERE id = $1;
        `,
        [resetRecord.id]
      );

      res.status(200).json({
        message: 'Password has been successfully reset. You can now sign in with your new password.',
      });
    } catch (error) {
      next(error);
    }
  }
);

