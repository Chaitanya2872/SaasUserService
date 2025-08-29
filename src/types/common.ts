export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  phone?: string | null;
  dateOfBirth?: Date | string | null;
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
  status?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}