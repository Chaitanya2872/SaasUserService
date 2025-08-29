import { User } from '../entities/User';
import { PaginatedResult, PaginationOptions } from '../types/common';
import { GetAllUsersFilters } from '../use-cases/GetAllUsers';

export interface IUserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(id: string, userData: Partial<User>): Promise<User | null>;
  delete(id: string): Promise<boolean>;
  findAll(options: PaginationOptions, filters?: GetAllUsersFilters): Promise<PaginatedResult<User>>;
}