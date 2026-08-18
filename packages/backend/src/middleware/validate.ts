import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { error } from '../utils/apiResponse';

/**
 * Middleware to validate incoming requests against Zod schemas.
 * Validates body, query, and params separately.
 * 
 * @param schema The Zod schema to validate against
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse the request using the provided schema
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        // Extract and format validation errors
        const formattedErrors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));

        return res.status(400).json(
          error('Validation Error', 'VALIDATION_ERROR', formattedErrors)
        );
      }
      
      // Pass other errors to the global error handler
      next(err);
    }
  };
};
