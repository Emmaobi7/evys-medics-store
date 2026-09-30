import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../db/connection';
import { validate } from '../middleware/validate';

export const contactRouter = Router();

const createInquirySchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name is required'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().optional().nullable(),
    organisation: z.string().optional().nullable(),
    enquiryType: z.string().default('general'),
    message: z.string().min(5, 'Please provide details for your inquiry'),
  }),
});

/**
 * POST /api/v1/contact
 * Submit a customer inquiry / clinic procurement reachout
 */
contactRouter.post(
  '/',
  validate(createInquirySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fullName, email, phone, organisation, enquiryType, message } = req.body;
      const inquiryId = `inq_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

      const insertSql = `
        INSERT INTO contact_inquiries (
          id, full_name, email, phone, organisation, enquiry_type, message, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
        RETURNING *;
      `;

      const result = await query(insertSql, [
        inquiryId,
        fullName.trim(),
        email.trim().toLowerCase(),
        phone ? phone.trim() : null,
        organisation ? organisation.trim() : null,
        enquiryType || 'general',
        message.trim(),
      ]);

      res.status(201).json({
        message: 'Your inquiry has been submitted successfully. A specialist will review and respond shortly.',
        inquiry: {
          id: result.rows[0].id,
          fullName: result.rows[0].full_name,
          email: result.rows[0].email,
          createdAt: result.rows[0].created_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);
