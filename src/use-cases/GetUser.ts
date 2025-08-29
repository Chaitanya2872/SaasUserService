import { User } from '../entities/User';
import { IUserRepository } from '../interfaces/IUserRepository';
import { CustomError } from '../presentation/middleware/errorMiddleware';

export class GetUser {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string): Promise<User> {
    if (!userId) {
      throw new CustomError('User ID is required', 400);
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new CustomError('Invalid user ID format', 400);
    }

    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    if (!user.isActive) {
      throw new CustomError('User account is deactivated', 403);
    }

    return user;
  }

  async executeByEmail(email: string): Promise<User> {
    if (!email) {
      throw new CustomError('Email is required', 400);
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new CustomError('Invalid email format', 400);
    }

    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    if (!user.isActive) {
      throw new CustomError('User account is deactivated', 403);
    }

    return user;
  }
}