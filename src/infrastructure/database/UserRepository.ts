import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole } from '../../entities/User';
import { IUserRepository } from '../../interfaces/IUserRepository';
import { PaginatedResult, PaginationOptions } from '../../types/common';
import { GetAllUsersFilters } from '../../use-cases/GetAllUsers';

export class UserRepository implements IUserRepository {
  constructor(private db: Pool) {}

  async create(user: User): Promise<User> {
    const query = `
      INSERT INTO user_service.users (
        id, email, password, first_name, last_name, phone, date_of_birth,
        role, status, is_active, email_verified, preferences, metadata,
        created_at, updated_at, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;
    
    const values = [
      user.id,
      user.email,
      user.password,
      user.firstName,
      user.lastName,
      user.phone || null,
      user.dateOfBirth || null,
      user.role,
      user.status,
      user.isActive,
      (user.emailVerified ?? false),
      JSON.stringify(user.preferences || {}),
      JSON.stringify(user.metadata || {}),
      user.createdAt,
      user.updatedAt,
      user.createdBy || user.id
    ];

    const result = await this.db.query(query, values);
    return this.mapRowToUser(result.rows[0]);
  }

  async findById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM user_service.users WHERE id = $1';
    const result = await this.db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToUser(result.rows[0]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM user_service.users WHERE email = $1';
    const result = await this.db.query(query, [email]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToUser(result.rows[0]);
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(userData)) {
      if (value !== undefined) {
        const dbField = this.camelToSnake(key);
        
        // Handle JSON fields
        if (key === 'preferences' || key === 'metadata') {
          fields.push(`${dbField} = $${paramCount}`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${dbField} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    values.push(id);

    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToUser(result.rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM user_service.users WHERE id = $1';
    const result = await this.db.query(query, [id]);
    
    return (result.rowCount ?? 0) > 0;
  }

  async findAll(
    options: PaginationOptions,
    filters?: GetAllUsersFilters
  ): Promise<PaginatedResult<User>> {
    const offset = (options.page - 1) * options.limit;
    
    // Build WHERE clause
    const whereConditions = [];
    const whereValues = [];
    let paramCount = 1;

    if (filters?.isActive !== undefined) {
      whereConditions.push(`is_active = $${paramCount}`);
      whereValues.push(filters.isActive);
      paramCount++;
    }

    if (filters?.role) {
      whereConditions.push(`role = $${paramCount}`);
      whereValues.push(filters.role);
      paramCount++;
    }

    if (filters?.emailVerified !== undefined) {
      whereConditions.push(`email_verified = $${paramCount}`);
      whereValues.push(filters.emailVerified);
      paramCount++;
    }

    if (filters?.search) {
      whereConditions.push(`(
        LOWER(first_name) LIKE LOWER($${paramCount}) OR 
        LOWER(last_name) LIKE LOWER($${paramCount}) OR 
        LOWER(email) LIKE LOWER($${paramCount})
      )`);
      whereValues.push(`%${filters.search}%`);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count query
    const countQuery = `SELECT COUNT(*) FROM user_service.users ${whereClause}`;
    const countResult = await this.db.query(countQuery, whereValues);
    const total = parseInt(countResult.rows[0].count);

    // Data query
    const dataQuery = `
      SELECT * FROM user_service.users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    const dataValues = [...whereValues, options.limit, offset];
    const result = await this.db.query(dataQuery, dataValues);
    const users = result.rows.map(row => this.mapRowToUser(row));

    return {
      data: users,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit)
    };
  }

  private mapRowToUser(row: any): User {
    const user = new User(
      row.id,
      row.email,
      row.password,
      row.first_name,
      row.last_name,
      row.role as UserRole,
      row.is_active,
      new Date(row.created_at),
      new Date(row.updated_at)
    );

    // Set additional properties
    user.phone = row.phone;
    user.dateOfBirth = row.date_of_birth ? new Date(row.date_of_birth) : null;
    user.status = row.status;
    user.emailVerified = row.email_verified;
    user.emailVerificationToken = row.email_verification_token;
    user.passwordResetToken = row.password_reset_token;
    user.passwordResetExpires = row.password_reset_expires ? new Date(row.password_reset_expires) : undefined;
    user.lastLogin = row.last_login ? new Date(row.last_login) : undefined;
    user.loginAttempts = row.login_attempts;
    user.lockedUntil = row.locked_until ? new Date(row.locked_until) : undefined;
    user.profileImageUrl = row.profile_image_url;
    user.preferences = row.preferences || {};
    user.metadata = row.metadata || {};
    user.createdBy = row.created_by;
    user.updatedBy = row.updated_by;

    return user;
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}