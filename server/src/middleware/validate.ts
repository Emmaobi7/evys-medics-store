import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema<any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (parsed.body !== undefined) {
        req.body = parsed.body;
      }
      if (parsed.query !== undefined && typeof req.query === 'object') {
        Object.assign(req.query, parsed.query);
      }
      (req as any).validated = parsed;
      return next();
    } catch (error) {
      return next(error);
    }
  };
}
