import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { config } from '../config/env';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // 1. Handle Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // 2. Handle Custom Operational Application Errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  // 3. Log Unexpected Errors internally
  console.error('[Unhandled Server Error]:', err);

  // 4. Safe Generic Response (Never leak raw database queries/errors to the client)
  const isDev = config.nodeEnv === 'development';
  return res.status(500).json({
    error: 'An unexpected server error occurred. Please try again later.',
    ...(isDev && { debugMessage: err.message }),
  });
}
