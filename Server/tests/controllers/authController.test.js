/**
 * @jest-environment node
 */



jest.mock('nodemailer');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
// jest.mock('crypto');
jest.mock('crypto', () => jest.requireActual('crypto'));
jest.mock('fs');

// Mock the models
jest.mock('../../src/models/User');
jest.mock('../../src/models/Business');
jest.mock('../../src/models/BusinessCategory');

// Mock the services
jest.mock('../../src/services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../src/services/auditService', () => ({
  log: jest.fn().mockResolvedValue(true)
}));

const mongoose = require('mongoose');
const User = require('../../src/models/User');
const Business = require('../../src/models/Business');
const BusinessCategory = require('../../src/models/BusinessCategory');
const { sendEmail } = require('../../src/services/emailService');
const auditService = require('../../src/services/auditService');
const AuthController = require('../../src/controllers/authController');

describe('AuthController', () => {
  let req, res, next;
  let mockUser, mockBusiness, mockBusinessCategory;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup request, response, and next function mocks
    req = {
      body: {},
      user: {},
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-user-agent'),
      file: null
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();

    // Setup mock objects
    mockUser = {
      _id: new mongoose.Types.ObjectId(),
      role: 'business_admin',
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        avatar: null,
        address: {},
        emergencyContact: {}
      },
      auth: {
        passwordHash: 'hashedpassword',
        emailVerified: false,
        lastLogin: null,
        resetToken: null,
        resetTokenExpiry: null
      },
      business: [],
      pets: [],
      isActive: true,
      settings: {},
      save: jest.fn().mockResolvedValue(true),
      comparePassword: jest.fn(),
      toObject: jest.fn().mockReturnValue({
        _id: new mongoose.Types.ObjectId(),
        role: 'business_admin',
        profile: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' }
      }),
      populate: jest.fn().mockReturnThis()
    };

    mockBusiness = {
      _id: new mongoose.Types.ObjectId(),
      profile: {
        name: 'Test Business',
        companyName: 'Test Company',
        email: 'business@example.com',
        phone: '+1234567890',
        category: new mongoose.Types.ObjectId(),
        address: {
          street: '123 Main St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'IND'
        }
      },
      services: [],
      schedule: {},
      staff: [],
      settings: {},
      subscription: {},
      isActive: true,
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockReturnThis(),
      createdAt: new Date()
    };

    mockBusinessCategory = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Pet Grooming',
      slug: 'pet-grooming'
    };

    // Setup default mocks
    User.findOne = jest.fn();
    User.findById = jest.fn();
    User.prototype.save = jest.fn().mockResolvedValue(true);
    User.prototype.comparePassword = jest.fn();
    
    Business.findOne = jest.fn();
    Business.prototype.save = jest.fn().mockResolvedValue(true);
    
    BusinessCategory.findById = jest.fn().mockResolvedValue(mockBusinessCategory);
    
    auditService.log.mockResolvedValue(true);
    sendEmail.mockResolvedValue(true);
  });

  describe('register', () => {
    beforeEach(() => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '+1234567890',
        role: 'business_admin',
        businessData: {
          profile: {
            name: 'Test Business',
            companyName: 'Test Company',
            email: 'business@example.com',
            phone: '+1234567890',
            category: mockBusinessCategory._id,
            address: {
              street: '123 Main St',
              city: 'Test City',
              state: 'Test State',
              zipCode: '12345'
            }
          }
        }
      };
      req.user = {
        userId: new mongoose.Types.ObjectId(),
        role: 'super_admin'
      };
    });

    test('should successfully register a business admin with business data', async () => {
      User.findOne.mockResolvedValue(null);
      Business.findOne.mockResolvedValue(null);
      
      const mockNewUser = { 
        ...mockUser, 
        save: jest.fn().mockResolvedValue(true),
        business: { push: jest.fn() }
      };
      User.mockImplementation(() => mockNewUser);

      const mockNewBusiness = { 
        ...mockBusiness, 
        save: jest.fn().mockResolvedValue(true) 
      };
      Business.mockImplementation(() => mockNewBusiness);

      await AuthController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Business admin registered successfully.',
        data: expect.objectContaining({
          user: expect.objectContaining({
            email: 'john@example.com',
            role: 'business_admin'
          }),
          business: expect.objectContaining({
            name: 'Test Business',
            companyName: 'Test Company'
          })
        })
      });
      expect(auditService.log).toHaveBeenCalledTimes(2);
    });

    test('should reject registration with invalid role', async () => {
      req.body.role = 'client';

      await AuthController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid role: only business_admin can be registered'
      });
    });

    test('should reject registration from non-super_admin', async () => {
      req.user.role = 'business_admin';

      await AuthController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Only super_admin can register business_admin'
      });
    });

    test('should reject registration with existing email', async () => {
      User.findOne.mockResolvedValue(mockUser);

      await AuthController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User with this email already exists'
      });
    });

    test('should handle registration errors', async () => {
      const error = new Error('Database error');
      User.findOne.mockRejectedValue(error);

      await AuthController.register(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    test('should normalize email to lowercase', async () => {
      req.body.email = 'JOHN@EXAMPLE.COM';
      User.findOne.mockResolvedValue(null);
      
      const mockNewUser = { 
        ...mockUser, 
        save: jest.fn().mockResolvedValue(true),
        business: { push: jest.fn() }
      };
      User.mockImplementation(() => mockNewUser);

      await AuthController.register(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({ 'profile.email': 'john@example.com' });
    });
  });

  describe('login', () => {
    beforeEach(() => {
      req.body = {
        email: 'john@example.com',
        password: 'password123'
      };
    });

    test('should successfully login with valid credentials', async () => {
      const mockUserWithPassword = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis(),
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: mockUser._id,
          role: 'business_admin',
          profile: mockUser.profile,
          auth: { lastLogin: new Date() }
        })
      };

      User.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(mockUserWithPassword)
        })
      });

      const jwt = require('jsonwebtoken');
      jwt.sign.mockReturnValue('mock-jwt-token');

      await AuthController.login(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: {
          token: 'mock-jwt-token',
          user: expect.objectContaining({
            _id: mockUser._id,
            role: 'business_admin'
          })
        }
      });
    });

    test('should reject login with invalid email', async () => {
      User.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(null)
        })
      });

      await AuthController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password'
      });
    });

    test('should reject login with invalid password', async () => {
      const mockUserWithPassword = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      User.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(mockUserWithPassword)
        })
      });

      await AuthController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password'
      });
    });

    test('should reject login for inactive account', async () => {
      const mockInactiveUser = {
        ...mockUser,
        isActive: false,
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      User.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(mockInactiveUser)
        })
      });

      await AuthController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Your account has been deactivated'
      });
    });
  });

  describe('getProfile', () => {
    beforeEach(() => {
      req.user = { userId: mockUser._id };
    });

    test('should successfully get user profile', async () => {
      User.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockUser)
        })
      });

      await AuthController.getProfile(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { user: mockUser }
      });
    });

    test('should return 404 for non-existent user', async () => {
      User.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      });

      await AuthController.getProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });
  });

  describe('updateProfile', () => {
    beforeEach(() => {
      req.user = { userId: mockUser._id };
      req.body = {
        firstName: 'Jane',
        profile: {
          lastName: 'Smith'
        },
        address: {
          street: '456 Oak St'
        }
      };
    });

    test('should successfully update user profile', async () => {
      User.findById.mockResolvedValueOnce(mockUser);
      User.findById.mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue({
            ...mockUser,
            profile: {
              ...mockUser.profile,
              firstName: 'Jane',
              lastName: 'Smith'
            }
          })
        })
      });

      await AuthController.updateProfile(req, res, next);

      expect(mockUser.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile updated successfully',
        data: expect.objectContaining({
          user: expect.any(Object)
        })
      });
    });

    test('should return 404 for non-existent user', async () => {
      User.findById.mockResolvedValue(null);

      await AuthController.updateProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });
  });

  describe('uploadAvatar', () => {
    beforeEach(() => {
      req.user = { userId: mockUser._id };
      req.file = {
        filename: 'avatar.jpg',
        path: '/tmp/avatar.jpg',
        size: 12345
      };
    });

    test('should successfully upload avatar', async () => {
      User.findById.mockResolvedValue(mockUser);
      const fs = require('fs');
      fs.existsSync.mockReturnValue(false);

      await AuthController.uploadAvatar(req, res, next);

      expect(mockUser.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Avatar uploaded successfully',
        data: expect.objectContaining({
          avatarUrl: '/uploads/avatars/avatar.jpg'
        })
      });
    });

    test('should return 400 when no file uploaded', async () => {
      req.file = null;

      await AuthController.uploadAvatar(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No file uploaded'
      });
    });
  });

  describe('changePassword', () => {
    beforeEach(() => {
      req.user = { userId: mockUser._id };
      req.body = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123'
      };
    });

    test('should successfully change password', async () => {
      const userWithPassword = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(true)
      };
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(userWithPassword)
      });

      await AuthController.changePassword(req, res, next);

      expect(userWithPassword.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password changed successfully'
      });
    });

    test('should reject password change with incorrect current password', async () => {
      const userWithPassword = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(userWithPassword)
      });

      await AuthController.changePassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Current password is incorrect'
      });
    });
  });

//   describe('forgotPassword', () => {
//     beforeEach(() => {
//       req.body = { email: 'john@example.com' };
      
//       const crypto = require('crypto');
//       crypto.randomBytes.mockReturnValue({
//         toString: jest.fn().mockReturnValue('reset-token-123')
//       });
//     });

//     test('should successfully send password reset email', async () => {
//       User.findOne.mockResolvedValue(mockUser);
//       Date.now = jest.fn().mockReturnValue(1000000);

//       await AuthController.forgotPassword(req, res, next);

//       expect(mockUser.save).toHaveBeenCalled();
//       expect(sendEmail).toHaveBeenCalledWith(
//         expect.objectContaining({
//           to: 'john@example.com',
//           subject: 'Password Reset - PetSync',
//           template: 'password-reset'
//         })
//       );
//       expect(res.json).toHaveBeenCalledWith({
//         success: true,
//         message: 'Password reset email sent'
//       });
//     });

//     test('should return 404 for non-existent email', async () => {
//       User.findOne.mockResolvedValue(null);

//       await AuthController.forgotPassword(req, res, next);

//       expect(res.status).toHaveBeenCalledWith(404);
//       expect(res.json).toHaveBeenCalledWith({
//         success: false,
//         message: 'User not found with this email'
//       });
//     });
//   });

  describe('resetPassword', () => {
    beforeEach(() => {
      req.body = {
        token: 'reset-token-123',
        newPassword: 'newpassword123'
      };
    });

    test('should successfully reset password', async () => {
      const userWithResetToken = {
        ...mockUser,
        auth: {
          ...mockUser.auth,
          resetToken: 'reset-token-123',
          resetTokenExpiry: Date.now() + 10 * 60 * 1000
        }
      };
      User.findOne.mockResolvedValue(userWithResetToken);

      await AuthController.resetPassword(req, res, next);

      expect(userWithResetToken.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password reset successfully'
      });
    });

    test('should reject invalid reset token', async () => {
      User.findOne.mockResolvedValue(null);

      await AuthController.resetPassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired reset token'
      });
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      req.user = { userId: mockUser._id };
    });

    test('should successfully logout', async () => {
      await AuthController.logout(req, res, next);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LOGOUT',
          user: req.user.userId
        })
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully'
      });
    });
  });
});

// ----------------------------------------------------------------
// server/jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'services/**/*.js',
    'middleware/**/*.js',
    'models/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  testTimeout: 10000,
  maxWorkers: 1,
  // Transform settings for ES modules if needed
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  // Module name mapping for better mock resolution
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};