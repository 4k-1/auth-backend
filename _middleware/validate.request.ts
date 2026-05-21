import { Request, NextFunction } from 'express';
import Joi from 'joi';

export default function validateRequest(req: Request, next: NextFunction, schema: Joi.ObjectSchema) {
  const { error } = schema.validate(req.body);
  if (error) {
    throw new Error(error.details[0].message);
  }
  next();
}