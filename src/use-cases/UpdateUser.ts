import { User } from '../entities/User';
import { IUserRepository } from '../interfaces/IUserRepository';
import { IAuthService } from '../interfaces/IAuthService';
import { UpdateUserDto } from '../types/common';
import { UserRole } from '../entities/User';
import { CustomError } from '../presentation/middleware/errorMiddleware';

export class UpdateUser {
  constructor(
    private userRepository: IUserRepository,
    private authService: IAuthService
  ) {}

  async execute(
    userId: string, 
    updateData: UpdateUserDto,
    updatedBy?: string
  ): Promise<User> {
    if (!userId) {
      throw new CustomError('User ID is required', 400);
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new CustomError('Invalid user ID format', 400);
    }

    // Check if user exists
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new CustomError('User not found', 404);
    }

    // Validate update data
    this.validateUpdateData(updateData);

    // Check if email is being changed and is not already taken
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await this.userRepository.findByEmail(updateData.email);
      if (emailExists) {
        throw new CustomError('Email already exists', 409);
      }
    }

    // Normalize date of birth to Date | null to satisfy Partial<User>
    let normalizedDob: Date | null | undefined = undefined;
    if (updateData.dateOfBirth !== undefined) {
      normalizedDob = updateData.dateOfBirth === null
        ? null
        : new Date(updateData.dateOfBirth);
    }

    // Prepare data for update (map only allowed fields with correct types)
    const updatePayload: Partial<User> = {
      ...(updateData.firstName !== undefined && { firstName: updateData.firstName }),
      ...(updateData.lastName !== undefined && { lastName: updateData.lastName }),
      ...(updateData.email !== undefined && { email: updateData.email }),
      ...(updateData.phone !== undefined && { phone: updateData.phone }),
      ...(normalizedDob !== undefined && { dateOfBirth: normalizedDob }),
      ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
      ...(updateData.status !== undefined && { status: updateData.status as any }),
      updatedBy: updatedBy || userId,
      updatedAt: new Date()
    };

    // Handle password update
    if (updateData.password) {
      updatePayload.password = await this.authService.hashPassword(updateData.password);
    }

    // Handle role validation
    if (updateData.role) {
      if (!Object.values(UserRole).includes(updateData.role as UserRole)) {
        throw new CustomError('Invalid role specified', 400);
      }
      updatePayload.role = updateData.role as UserRole;
    }

    try {
      const updatedUser = await this.userRepository.update(userId, updatePayload);
      
      if (!updatedUser) {
        throw new CustomError('Failed to update user', 500);
      }

      return updatedUser;
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(`Failed to update user: ${error.message}`, 500);
    }
  }

  async updateProfile(
    userId: string,
    profileData: Pick<UpdateUserDto, 'firstName' | 'lastName' | 'phone' | 'dateOfBirth'>
  ): Promise<User> {
    return this.execute(userId, {
      ...profileData,
      password: undefined
    }, userId);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await this.authService.comparePassword(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      throw new CustomError('Current password is incorrect', 401);
    }

    // Validate new password
    if (newPassword.length < 8) {
      throw new CustomError('New password must be at least 8 characters long', 400);
    }

    // Update password
    return this.execute(userId, {
        password: newPassword,
        phone: undefined,
        dateOfBirth: undefined
    }, userId);
  }

  async deactivateUser(userId: string, deactivatedBy: string): Promise<User> {
    return this.execute(userId, { isActive: false, status: 'inactive' }, deactivatedBy);
  }

  async activateUser(userId: string, activatedBy: string): Promise<User> {
    return this.execute(userId, { isActive: true, status: 'active' }, activatedBy);
  }

  async updateRole(
    userId: string,
    newRole: UserRole,
    updatedBy: string
  ): Promise<User> {
    // Additional validation for role updates
    if (!Object.values(UserRole).includes(newRole)) {
      throw new CustomError('Invalid role specified', 400);
    }

    return this.execute(userId, {
        role: newRole,
        password: undefined,
        phone: undefined,
        dateOfBirth: undefined
    }, updatedBy);
  }

  private validateUpdateData(updateData: UpdateUserDto): void {
    // Validate first name
    if (updateData.firstName !== undefined) {
      if (typeof updateData.firstName !== 'string' || updateData.firstName.trim().length === 0) {
        throw new CustomError('First name must be a non-empty string', 400);
      }
      if (updateData.firstName.length > 100) {
        throw new CustomError('First name must be less than 100 characters', 400);
      }
    }

    // Validate last name
    if (updateData.lastName !== undefined) {
      if (typeof updateData.lastName !== 'string' || updateData.lastName.trim().length === 0) {
        throw new CustomError('Last name must be a non-empty string', 400);
      }
      if (updateData.lastName.length > 100) {
        throw new CustomError('Last name must be less than 100 characters', 400);
      }
    }

    // Validate email
    if (updateData.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        throw new CustomError('Invalid email format', 400);
      }
    }

    // Validate phone
    if (updateData.phone !== undefined && updateData.phone !== null) {
      if (typeof updateData.phone !== 'string') {
        throw new CustomError('Phone must be a string', 400);
      }
      const phoneRegex = /^[\+]?[0-9\-\(\)\s]+$/;
      if (!phoneRegex.test(updateData.phone)) {
        throw new CustomError('Invalid phone number format', 400);
      }
    }

    // Validate password
    if (updateData.password !== undefined) {
      if (typeof updateData.password !== 'string' || updateData.password.length < 8) {
        throw new CustomError('Password must be at least 8 characters long', 400);
      }
    }

    // Validate date of birth
    if (updateData.dateOfBirth !== undefined) {
      // Allow explicit null to clear date of birth
      if (updateData.dateOfBirth !== null) {
        const dob = typeof updateData.dateOfBirth === 'string'
          ? new Date(updateData.dateOfBirth)
          : updateData.dateOfBirth;
        if (isNaN(dob.getTime())) {
          throw new CustomError('Invalid date of birth', 400);
        }
        if (dob > new Date()) {
          throw new CustomError('Date of birth cannot be in the future', 400);
        }
      }
    }
  }
}