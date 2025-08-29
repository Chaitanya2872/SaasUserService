import { IUserRepository } from '../interfaces/IUserRepository';
import { CustomError } from '../presentation/middleware/errorMiddleware';
import { UserRole } from '../entities/User';

export class DeleteUser {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string, deletedBy?: string): Promise<boolean> {
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

    // Prevent self-deletion check (if deletedBy is provided)
    if (deletedBy && deletedBy === userId) {
      throw new CustomError('You cannot delete your own account', 400);
    }

    // Additional protection for admin users
    if (existingUser.role === UserRole.ADMIN || existingUser.role === UserRole.SUPER_ADMIN) {
      throw new CustomError('Admin users cannot be deleted directly', 403);
    }

    try {
      const isDeleted = await this.userRepository.delete(userId);
      
      if (!isDeleted) {
        throw new CustomError('Failed to delete user', 500);
      }

      return true;
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(`Failed to delete user: ${error.message}`, 500);
    }
  }

  // Soft delete - deactivate user instead of hard delete
  async softDelete(userId: string, deletedBy?: string): Promise<boolean> {
    if (!userId) {
      throw new CustomError('User ID is required', 400);
    }

    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new CustomError('User not found', 404);
    }

    // Prevent self-deletion
    if (deletedBy && deletedBy === userId) {
      throw new CustomError('You cannot delete your own account', 400);
    }

    try {
      const updateData = {
        isActive: false,
        status: 'inactive' as const,
        updatedBy: deletedBy,
        updatedAt: new Date()
      };

      const updatedUser = await this.userRepository.update(userId, updateData);
      return !!updatedUser;
    } catch (error: any) {
      throw new CustomError(`Failed to deactivate user: ${error.message}`, 500);
    }
  }

  // Admin-only hard delete with additional checks
  async adminDelete(
    userId: string, 
    adminUserId: string,
    forceDelete: boolean = false
  ): Promise<boolean> {
    // Verify admin user exists and has proper permissions
    const adminUser = await this.userRepository.findById(adminUserId);
    if (!adminUser) {
      throw new CustomError('Admin user not found', 404);
    }

    if (adminUser.role !== UserRole.ADMIN && adminUser.role !== UserRole.SUPER_ADMIN) {
      throw new CustomError('Insufficient permissions to perform admin delete', 403);
    }

    const targetUser = await this.userRepository.findById(userId);
    if (!targetUser) {
      throw new CustomError('Target user not found', 404);
    }

    // Additional protection unless force delete is enabled
    if (!forceDelete) {
      if (targetUser.role === UserRole.ADMIN && adminUser.role !== UserRole.SUPER_ADMIN) {
        throw new CustomError('Only super admin can delete admin users', 403);
      }

      if (targetUser.role === UserRole.SUPER_ADMIN) {
        throw new CustomError('Super admin users cannot be deleted', 403);
      }
    }

    return this.execute(userId, adminUserId);
  }

  // Bulk delete users (admin only)
  async bulkDelete(
    userIds: string[],
    adminUserId: string
  ): Promise<{ succeeded: string[], failed: string[] }> {
    if (!userIds || userIds.length === 0) {
      throw new CustomError('User IDs array is required', 400);
    }

    if (userIds.length > 50) {
      throw new CustomError('Cannot delete more than 50 users at once', 400);
    }

    // Verify admin permissions
    const adminUser = await this.userRepository.findById(adminUserId);
    if (!adminUser || (adminUser.role !== UserRole.ADMIN && adminUser.role !== UserRole.SUPER_ADMIN)) {
      throw new CustomError('Insufficient permissions for bulk delete', 403);
    }

    const succeeded: string[] = [];
    const failed: string[] = [];

    for (const userId of userIds) {
      try {
        await this.execute(userId, adminUserId);
        succeeded.push(userId);
      } catch (error) {
        failed.push(userId);
      }
    }

    return { succeeded, failed };
  }
}