import { Request, Response, NextFunction } from 'express';
import { IAuthService } from '../../interfaces/IAuthService';
import { ApiResponse } from '../../types/common';
import { UserRole } from '../../entities/User';
import { CustomError } from './errorMiddleware';
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

export const authMiddleware = (
  authService: IAuthService,
  allowedRoles?: UserRole[]
) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Get token from header
      const authHeader = req.header('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new CustomError('Access denied. No valid token provided.', 401);
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify token
      const decoded = authService.verifyToken(token);
      
      // Check if token payload has required fields
      if (!decoded.userId || !decoded.email || !decoded.role) {
        throw new CustomError('Invalid token payload.', 401);
      }

      // Set user info in request
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role as UserRole
      };

      // Check role permissions if specified
      if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(req.user.role)) {
          throw new CustomError('Access denied. Insufficient permissions.', 403);
        }
      }

      next();
    } catch (error: any) {
      if (error.name === 'JsonWebTokenError') {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid token.',
          error: 'Invalid token'
        };
        res.status(401).json(response);
        return;
      }

      if (error.name === 'TokenExpiredError') {
        const response: ApiResponse = {
          success: false,
          message: 'Token expired.',
          error: 'Token expired'
        };
        res.status(401).json(response);
        return;
      }

      next(error);
    }
  };
};

// Optional user middleware (doesn't throw error if no token)
export const optionalAuthMiddleware = (authService: IAuthService) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = authService.verifyToken(token);
        
        if (decoded.userId && decoded.email && decoded.role) {
          req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role as UserRole
          };
        }
      }
      next();
    } catch (error) {
      // Don't throw error, just continue without user
      next();
    }
  };
};