import Joi from 'joi';
import { UserRole } from '../entities/User';

// User registration validation schema
export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must be less than 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required'
    }),
  
  firstName: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.min': 'First name is required',
      'string.max': 'First name must be less than 100 characters',
      'any.required': 'First name is required'
    }),
  
  lastName: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.min': 'Last name is required',
      'string.max': 'Last name must be less than 100 characters',
      'any.required': 'Last name is required'
    }),
  
  phone: Joi.string()
    .pattern(new RegExp('^[\\+]?[0-9\\-\\(\\)\\s]+$'))
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .default(UserRole.USER)
    .messages({
      'any.only': 'Invalid role specified'
    }),

  dateOfBirth: Joi.date()
    .max('now')
    .allow(null)
    .messages({
      'date.max': 'Date of birth cannot be in the future'
    })
});

// User login validation schema
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

// Update user validation schema
export const updateUserSchema = Joi.object({
  email: Joi.string()
    .email()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),
  
  firstName: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .messages({
      'string.min': 'First name cannot be empty',
      'string.max': 'First name must be less than 100 characters'
    }),
  
  lastName: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .messages({
      'string.min': 'Last name cannot be empty',
      'string.max': 'Last name must be less than 100 characters'
    }),
  
  phone: Joi.string()
    .pattern(new RegExp('^[\\+]?[0-9\\-\\(\\)\\s]+$'))
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .messages({
      'any.only': 'Invalid role specified'
    }),

  dateOfBirth: Joi.date()
    .max('now')
    .allow(null)
    .messages({
      'date.max': 'Date of birth cannot be in the future'
    }),

  isActive: Joi.boolean(),

  status: Joi.string()
    .valid('active', 'inactive', 'suspended', 'pending_verification'),

  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must be less than 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }),

  preferences: Joi.object(),
  
  metadata: Joi.object()
}).min(1).messages({
  'object.min': 'At least one field is required for update'
});

// Get user by ID validation schema
export const getUserSchema = Joi.object({
  id: Joi.string()
    .guid({ version: 'uuidv4' })
    .required()
    .messages({
      'string.guid': 'Invalid user ID format',
      'any.required': 'User ID is required'
    })
});

// Get all users validation schema
export const getAllUsersSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be greater than 0'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be greater than 0',
      'number.max': 'Limit cannot exceed 100'
    }),
  
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .messages({
      'any.only': 'Invalid role filter'
    }),
  
  isActive: Joi.boolean(),
  
  search: Joi.string()
    .min(1)
    .max(255)
    .trim()
    .messages({
      'string.min': 'Search term cannot be empty',
      'string.max': 'Search term is too long'
    }),
  
  emailVerified: Joi.boolean()
});

// Change password validation schema
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.max': 'New password must be less than 128 characters',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'New password is required'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Password confirmation does not match',
      'any.required': 'Password confirmation is required'
    })
});