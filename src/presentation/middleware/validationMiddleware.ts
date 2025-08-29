import { Request, Response, NextFunction } from 'express';

export function validationMiddleware(schema: any, property: string = 'body') {
	return (req: Request, res: Response, next: NextFunction) => {
		// Add validation logic here, e.g. using Joi or Yup
		// For now, just call next()
		next();
	};
}
