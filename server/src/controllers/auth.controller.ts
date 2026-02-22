import { Request, Response } from 'express';
import User from '../model/user.model';
import tokenService from '../services/token.service';
import { UnauthorizedError } from '../utils/customErrors';
import asyncHandler from '../utils/asyncHandler';
import logger from '../utils/logger';
import { Types } from 'mongoose'; // Using Types.ObjectId for consistency

interface IAuthResponse {
  success: boolean;
  accessToken?: string;
  message?: string;
  user?: {
    id: string;
    name?: string;
    email?: string;
    role?: string;
  };
}

interface AuthenticatedRequest extends Request {
  user: {
    _id: Types.ObjectId;
    id: string;
    email?: string;
    role: string;
  };
}

class AuthController {
  adminLogin = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { email, password } = req.body;
      logger.info(`Admin login attempt for email: ${email}`);

      const user = await User.findOne({ email }).select('+password +refreshToken'); // Select refreshToken as well
      if (!user) {
        logger.warn(`No account found with email: ${email}`);
        throw new UnauthorizedError('Invalid credentials');
      }

      if (user.role !== 'admin') {
        logger.warn(`Non-admin user attempted admin login: ${email}`);
        throw new UnauthorizedError('Access denied: Admin privileges required');
      }

      const isPasswordCorrect = await user.comparePassword(password);
      if (!isPasswordCorrect) {
        logger.warn(`Incorrect password attempt for admin: ${email}`);
        throw new UnauthorizedError('Invalid credentials');
      }

      const tokens = tokenService.generateTokens({
        userId: String(user._id),
        email: user.email,
        role: user.role,
      });

      user.refreshToken = tokens.refreshToken; // Restore saving refreshToken
      user.lastLogin = new Date(); // Update last login time
      await user.save();

      tokenService.setRefreshTokenCookie(res, tokens.refreshToken);
      logger.info(`Admin login successful for: ${email}`);

      const response: IAuthResponse = {
        success: true,
        accessToken: tokens.accessToken,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };

      res.json(response);
    }
  );

  refreshToken = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        throw new UnauthorizedError('Refresh token is required');
      }

      const decoded = await tokenService.verifyRefreshToken(refreshToken);
      const user = await User.findById(decoded.userId).select('+refreshToken'); // Select refreshToken to compare

      if (!user) {
        throw new UnauthorizedError('User not found');
      }
      
      if (user.role !== 'admin') {
        throw new UnauthorizedError('Access denied: Admin privileges required to refresh token');
      }

      // Check if the refresh token from the cookie matches the one stored in the database
      if (user.refreshToken !== refreshToken) {
        logger.warn(`Attempted refresh with invalid refresh token for user: ${user.email}`);
        throw new UnauthorizedError('Invalid refresh token');
      }

      const tokens = await tokenService.rotateRefreshToken(refreshToken, {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      user.refreshToken = tokens.refreshToken; // Save new refreshToken
      await user.save();

      tokenService.setRefreshTokenCookie(res, tokens.refreshToken);

      const response: IAuthResponse = {
        success: true,
        accessToken: tokens.accessToken,
      };

      res.status(200).json(response);
    }
  );

  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      try {
        const decoded = await tokenService.verifyRefreshToken(refreshToken);
        const user = await User.findById(decoded.userId).select('+refreshToken');

        if (user && user.refreshToken === refreshToken) {
          user.refreshToken = undefined; // Clear refreshToken from DB
          await user.save();
        }
        // Blacklist token is handled by tokenService already if desired, but not strictly needed if only clearing from user model.
        // Keeping it simple with just clearing from user model for now.
      } catch (error) {
        logger.warn('Error during logout token verification or clearing:', error);
      }
    }

    tokenService.clearRefreshTokenCookie(res);

    const response: IAuthResponse = {
      success: true,
      message: 'Logged out successfully',
    };

    res.status(200).json(response);
  });

  verifyToken = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as AuthenticatedRequest).user;
      const response: IAuthResponse = {
        success: true,
        user: {
          id: user.id || user._id.toString(),
          role: user.role,
        },
      };

      res.status(200).json(response);
    }
  );
}

export default new AuthController();
