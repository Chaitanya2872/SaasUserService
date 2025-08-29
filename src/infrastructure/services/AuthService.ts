import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { IAuthService } from '../../interfaces/IAuthService';

export class AuthService implements IAuthService {
  private jwtSecret: string;
  private jwtExpiresIn: jwt.SignOptions['expiresIn'];
  private saltRounds: number;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret';
    const rawExpiresIn = process.env.JWT_EXPIRES_IN ?? '7d';
    // If numeric (e.g., "3600"), convert to number; otherwise keep as string typed for JWT SignOptions
    this.jwtExpiresIn = /^\d+$/.test(rawExpiresIn)
      ? Number(rawExpiresIn)
      : (rawExpiresIn as unknown as jwt.SignOptions['expiresIn']);

    // Allow tuning bcrypt rounds via env, default to 10 for better dev performance
    const parsedRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
    this.saltRounds = Number.isNaN(parsedRounds) ? 10 : Math.min(Math.max(parsedRounds, 6), 14);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  generateToken(payload: string | object | Buffer): string {
    const options: jwt.SignOptions = { expiresIn: this.jwtExpiresIn };
    return jwt.sign(payload, this.jwtSecret, options);
  }

  verifyToken(token: string): any {
    return jwt.verify(token, this.jwtSecret as jwt.Secret);
  }
}