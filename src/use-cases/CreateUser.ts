import { v4 as uuidv4 } from 'uuid';
import { User, UserRole } from '../entities/User';
import { IUserRepository } from '../interfaces/IUserRepository';
import { IAuthService } from '../interfaces/IAuthService';
import { CreateUserDto } from '../types/common';

export class CreateUser {
  constructor(
    private userRepository: IUserRepository,
    private authService: IAuthService
  ) {}

  async execute(userData: CreateUserDto): Promise<User> {
    const t0 = Date.now();

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    const t1 = Date.now();
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const hashedPassword = await this.authService.hashPassword(userData.password);
    const t2 = Date.now();

    // Create user
    const user = new User(
      uuidv4(),
      userData.email,
      hashedPassword,
      userData.firstName,
      userData.lastName,
      (userData.role as UserRole) || UserRole.USER
    );

    const createdUser = await this.userRepository.create(user);
    const t3 = Date.now();

    // Lightweight inline timing logs (console to avoid logger import in use-case layer)
    // Consider switching to a shared logger if desired
    console.info('[CreateUser] timings (ms)', {
      findByEmail: t1 - t0,
      hashPassword: t2 - t1,
      insertUser: t3 - t2,
      total: t3 - t0,
    });

    // Publish user created event
    // await this.eventPublisher.publish('UserCreated', { userId: createdUser.id, email: createdUser.email });

    return createdUser;
  }
}