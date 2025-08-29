import { IAuthService } from '../interfaces/IAuthService';
import { IUserRepository } from '../interfaces/IUserRepository';
import { AuthPayload} from '../types/common';
import { UserRole} from '../entities/User';
import { CustomError } from '../presentation/middleware/errorMiddleware';

export class VerifyToken {
  constructor(
    private authService: IAuthService,
    private userRepository: IUserRepository
  ) {}

  async execute(token: string): Promise<AuthPayload> {
    if (!token) {
      throw new CustomError('Token is required', 400);
    }

    try {
      // Verify and decode the token
      const decoded = this.authService.verifyToken(token);
      
      // Validate token payload
      if (!decoded.userId || !decoded.email || !decoded.role) {
        throw new CustomError('Invalid token payload', 401);
      }

      // Optional: Verify user still exists and is active
      const user = await this.userRepository.findById(decoded.userId);
      if (!user) {
        throw new CustomError('User no longer exists', 401);
      }

      if (!user.isActive) {
        throw new CustomError('User account is deactivated', 401);
      }

      // Return authenticated user payload
      const authPayload: AuthPayload = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role as UserRole
      };

      return authPayload;
    } catch (error: any) {
      if (error.name === 'JsonWebTokenError') {
        throw new CustomError('Invalid token', 401);
      }
      
      if (error.name === 'TokenExpiredError') {
        throw new CustomError('Token expired', 401);
      }

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError('Token verification failed', 401);
    }
  }

  async executeWithRefresh(token: string): Promise<{ authPayload: AuthPayload; newToken?: string }> {
    const authPayload = await this.execute(token);
    
    // Optional: Generate new token if current one is close to expiry
    // This implements a token refresh mechanism
    try {
      const decoded = this.authService.verifyToken(token);
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - now;
      
      // If token expires in less than 1 hour, generate a new one
      if (timeUntilExpiry < 3600) {
        const newToken = this.authService.generateToken({
          userId: authPayload.userId,
          email: authPayload.email,
          role: authPayload.role
        });
        
        return { authPayload, newToken };
      }
      
      return { authPayload };
    } catch (error) {
      return { authPayload };
    }
  }
}