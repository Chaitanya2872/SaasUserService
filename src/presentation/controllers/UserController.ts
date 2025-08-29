import { Request, Response } from 'express';
import { CreateUser } from '../../use-cases/CreateUser';
import { LoginUser } from '../../use-cases/LoginUser';
import { GetUser } from '../../use-cases/GetUser';
import { UpdateUser } from '../../use-cases/UpdateUser';
import { DeleteUser } from '../../use-cases/DeleteUser';
import { GetAllUsers } from '../../use-cases/GetAllUsers';
import { ApiResponse } from '../../types/common';

export class UserController {
  constructor(
    private createUser: CreateUser,
    private loginUser: LoginUser,
    private getUser: GetUser,
    private updateUser: UpdateUser,
    private deleteUser: DeleteUser,
    private getAllUsers: GetAllUsers
  ) {}

  async register(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.createUser.execute(req.body);
      const response: ApiResponse = {
        success: true,
        message: 'User created successfully',
        data: user.toJSON()
      };
      res.status(201).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message,
        error: error.message
      };
      res.status(400).json(response);
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.loginUser.execute(req.body);
      const response: ApiResponse = {
        success: true,
        message: 'Login successful',
        data: result
      };
      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message,
        error: error.message
      };
      res.status(401).json(response);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.getUser.execute(req.params.id);
      const response: ApiResponse = {
        success: true,
        message: 'User retrieved successfully',
        data: user?.toJSON()
      };
      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message,
        error: error.message
      };
      res.status(404).json(response);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.updateUser.execute(req.params.id, req.body);
      const response: ApiResponse = {
        success: true,
        message: 'User updated successfully',
        data: user?.toJSON()
      };
      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message,
        error: error.message
      };
      res.status(400).json(response);
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await this.deleteUser.execute(req.params.id);
      const response: ApiResponse = {
        success: true,
        message: 'User deleted successfully'
      };
      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message,
        error: error.message
      };
      res.status(404).json(response);
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await this.getAllUsers.execute({ page, limit });
      const response: ApiResponse = {
        success: true,
        message: 'Users retrieved successfully',
        data: {
          ...result,
          data: result.data.map(user => user.toJSON())
        }
      };
      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message,
        error: error.message
      };
      res.status(500).json(response);
    }
  }

  async verifyToken(req: Request, res: Response): Promise<void> {
    try {
      // Token is already verified by middleware
      const response: ApiResponse = {
        success: true,
        message: 'Token is valid',
        data: (req as any).user
      };
      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message,
        error: error.message
      };
      res.status(401).json(response);
    }
  }
}