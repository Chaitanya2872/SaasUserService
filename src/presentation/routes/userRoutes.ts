import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validationMiddleware } from '../middleware/validationMiddleware';
import { UserRole } from '../../entities/User';
// Ensure UserRole is exported as an enum from '../../entities/User'
import { 
  registerSchema, 
  loginSchema, 
  updateUserSchema,
  getUserSchema,
  getAllUsersSchema 
} from '../../utils/validators';

// Dependencies injection - In a real app, you'd use a DI container
import { UserRepository } from '../../infrastructure/database/UserRepository';
import { AuthService } from '../../infrastructure/services/AuthService';
import { CreateUser } from '../../use-cases/CreateUser';
import { LoginUser } from '../../use-cases/LoginUser';
import { GetUser } from '../../use-cases/GetUser';
import { UpdateUser } from '../../use-cases/UpdateUser';
import { DeleteUser } from '../../use-cases/DeleteUser';
import { GetAllUsers } from '../../use-cases/GetAllUsers';
import { VerifyToken } from '../../use-cases/VerifyToken';
import pool from '../../config/database';

const router = Router();

// Initialize dependencies
const userRepository = new UserRepository(pool);
const authService = new AuthService();

// Initialize use cases
const createUser = new CreateUser(userRepository, authService);
const loginUser = new LoginUser(userRepository, authService);
const getUser = new GetUser(userRepository);
const updateUser = new UpdateUser(userRepository, authService);
const deleteUser = new DeleteUser(userRepository);
const getAllUsers = new GetAllUsers(userRepository);
const verifyToken = new VerifyToken(authService, userRepository);

// Initialize controller
const userController = new UserController(
  createUser,
  loginUser,
  getUser,
  updateUser,
  deleteUser,
  getAllUsers
);

// Public routes (no authentication required)
router.post(
  '/auth/register',
  validationMiddleware(registerSchema),
  (req, res) => userController.register(req, res)
);

router.post(
  '/auth/login',
  validationMiddleware(loginSchema),
  (req, res) => userController.login(req, res)
);

// Protected routes (authentication required)
router.get(
  '/auth/verify',
  authMiddleware(authService),
  (req, res) => userController.verifyToken(req, res)
);

router.get(
  '/users',
  authMiddleware(authService),
  validationMiddleware(getAllUsersSchema, 'query'),
  (req, res) => userController.getAll(req, res)
);

router.get(
  '/users/:id',
  authMiddleware(authService),
  validationMiddleware(getUserSchema, 'params'),
  (req, res) => userController.getById(req, res)
);

router.put(
  '/users/:id',
  authMiddleware(authService),
  validationMiddleware(getUserSchema, 'params'),
  validationMiddleware(updateUserSchema),
  (req, res) => userController.update(req, res)
);

router.delete(
  '/users/:id',
  authMiddleware(authService),
  validationMiddleware(getUserSchema, 'params'),
  (req, res) => userController.delete(req, res)
);

// Admin only routes
router.get(
  '/admin/users',
  authMiddleware(authService, [UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  validationMiddleware(getAllUsersSchema, 'query'),
  (req, res) => userController.getAll(req, res)
);

export default router;