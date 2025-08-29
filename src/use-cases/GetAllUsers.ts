import { User } from '../entities/User';
import { IUserRepository } from '../interfaces/IUserRepository';
// If UserRole is defined elsewhere, import from the correct path, e.g.:
import { PaginatedResult, PaginationOptions } from '../types/common';
import { UserRole } from '../entities/User'; // Adjust path as needed
import { CustomError } from '../presentation/middleware/errorMiddleware';

export interface GetAllUsersFilters {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
  emailVerified?: boolean;
}

export class GetAllUsers {
  constructor(private userRepository: IUserRepository) {}

  async execute(
    options: PaginationOptions,
    filters?: GetAllUsersFilters
  ): Promise<PaginatedResult<User>> {
    // Validate pagination options
    if (options.page < 1) {
      throw new CustomError('Page number must be greater than 0', 400);
    }

    if (options.limit < 1 || options.limit > 100) {
      throw new CustomError('Limit must be between 1 and 100', 400);
    }

    // Apply default filters
    const appliedFilters: GetAllUsersFilters = {
      isActive: filters?.isActive !== undefined ? filters.isActive : true,
      ...filters
    };

    try {
      const result = await this.userRepository.findAll(options, appliedFilters);
      
      // Remove password from all users
      const sanitizedUsers = result.data.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword as User;
      });

      return {
        ...result,
        data: sanitizedUsers
      };
    } catch (error: any) {
      throw new CustomError(`Failed to fetch users: ${error.message}`, 500);
    }
  }

  async executeForAdmin(
    options: PaginationOptions,
    filters?: GetAllUsersFilters
  ): Promise<PaginatedResult<User>> {
    // Admin can see all users including inactive ones
    return this.execute(options, filters);
  }

  async getActiveUsersCount(): Promise<number> {
    try {
      const result = await this.userRepository.findAll({
        page: 1,
        limit: 1
      });
      return result.total;
    } catch (error: any) {
      throw new CustomError(`Failed to get users count: ${error.message}`, 500);
    }
  } 

  async getUsersByRole(role: UserRole): Promise<User[]> {
    try {
      const result = await this.userRepository.findAll(
        { page: 1, limit: 1000 }
      );
      
      // Remove password from all users
      const sanitizedUsers = result.data.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword as User;
      });

      return sanitizedUsers;
    } catch (error: any) {
      throw new CustomError(`Failed to fetch users by role: ${error.message}`, 500);
    }
  }
}