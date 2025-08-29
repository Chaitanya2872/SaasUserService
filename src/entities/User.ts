export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MANAGER = 'manager',
  SUPER_ADMIN = "SUPER_ADMIN"
}

export class User {
  phone: string | null = null;
  dateOfBirth: Date | null = null;
  status: any;
  emailVerified: any;
  preferences!: {};
  metadata!: {};
  createdBy!: string;
  emailVerificationToken: any;
  passwordResetToken: any;
  passwordResetExpires: Date | undefined;
  lastLogin: Date | undefined;
  loginAttempts: any;
  lockedUntil: Date | undefined;
  profileImageUrl: any;
  updatedBy: any;
  constructor(
    public id: string,
    public email: string,
    public password: string,
    public firstName: string,
    public lastName: string,
    public role: UserRole = UserRole.USER,
    public isActive: boolean = true,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  public toJSON(): Omit<User, 'password' | 'getFullName' | 'isAdmin' | 'toJSON' | 'getFullName' | 'isAdmin' | 'toJSON'> {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}