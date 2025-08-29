import { IUserRepository } from '../interfaces/IUserRepository';
import { IAuthService } from '../interfaces/IAuthService';
import { LoginDto } from '../types/common';

export class LoginUser {
  constructor(
    private userRepository: IUserRepository,
    private authService: IAuthService
  ) {}

  async execute(loginData: LoginDto): Promise<{ user: any; token: string }> {
    const user = await this.userRepository.findByEmail(loginData.email);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await this.authService.comparePassword(
      loginData.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    const token = this.authService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return {
      user: user.toJSON(),
      token
    };
  }
}