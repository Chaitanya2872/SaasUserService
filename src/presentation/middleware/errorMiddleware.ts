import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../types/common';

export interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
  code?: string;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle JWT errors
const handleJWTError = (): CustomError => {
  return new CustomError('Invalid token. Please log in again!', 401);
};

// Handle JWT expired error
const handleJWTExpiredError = (): CustomError => {
  return new CustomError('Your token has expired! Please log in again.', 401);
};

// Handle database errors
const handleDatabaseError = (err: any): CustomError => {
  let message = 'Database error occurred';

  if (err.code === '23505') {
    // Unique constraint violation
    const field = err.detail?.match(/Key \((.+?)\)=/)?.[1] || 'field';
    message = `${field} already exists`;
    return new CustomError(message, 409);
  }

  if (err.code === '23503') {
    // Foreign key constraint violation
    message = 'Referenced record does not exist';
    return new CustomError(message, 400);
  }

  if (err.code === '23502') {
    // Not null constraint violation
    const field = err.column || 'field';
    message = `${field} is required`;
    return new CustomError(message, 400);
  }

  return new CustomError(message, 500);
};

// Handle validation errors
const handleValidationError = (err: any): CustomError => {
  const errors = err.details?.map((detail: any) => detail.message).join(', ') || 'Validation error';
  return new CustomError(errors, 400);
};

// Send error response in development
const sendErrorDev = (err: AppError, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    message: err.message,
    error: err.message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  };

  res.status(err.statusCode || 500).json(response);
};

// Send error response in production
const sendErrorProd = (err: AppError, res: Response): void => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    const response: ApiResponse = {
      success: false,
      message: err.message,
      error: err.message
    };

    res.status(err.statusCode || 500).json(response);
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);

    const response: ApiResponse = {
      success: false,
      message: 'Something went wrong!',
      error: 'Internal server error'
    };

    res.status(500).json(response);
  }
};

export const errorMiddleware = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.code?.startsWith('23')) error = handleDatabaseError(error);
    if (error.name === 'ValidationError') error = handleValidationError(error);

    sendErrorProd(error, res);
  }
};

// Async error handler wrapper
export const asyncErrorHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global unhandled rejection handler
export const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (err: Error) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
  });
};

// Global uncaught exception handler
export const handleUncaughtException = () => {
  process.on('uncaughtException', (err: Error) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
  });
};