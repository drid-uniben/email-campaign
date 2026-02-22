import { Request, Response } from 'express';
import { UnauthorizedError, BadRequestError, NotFoundError } from '../utils/customErrors';
import asyncHandler from '../utils/asyncHandler';
import logger from '../utils/logger';
import User, { IUser, UserRole } from '../model/user.model';
import Unit from '../model/unit.model';

interface AdminAuthenticatedRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}

class AdminController {
  // Get all users with filtering
  getUsers = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { 
        role, 
        unitId, 
        isApproved, 
        search, 
        page = 1, 
        limit = 20 
      } = req.query;

      const query: any = {};

      if (role && role !== 'all') {
        query.role = role;
      }

      if (unitId && unitId !== 'all') {
        if (unitId === 'unassigned') {
          query.unit = { $exists: false };
        } else {
          query.unit = unitId;
        }
      }

      if (isApproved !== undefined && isApproved !== 'all') {
        query.isApproved = isApproved === 'true';
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const options = {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      };

      const users = await User.find(query)
        .populate('unit', 'name')
        .sort({ createdAt: -1 })
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .lean();

      const total = await User.countDocuments(query);

      res.status(200).json({
        success: true,
        count: users.length,
        totalPages: Math.ceil(total / options.limit),
        currentPage: options.page,
        data: users,
      });
    }
  );

  // Add Interns (Single or Bulk)
  addInterns = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { unitId, input } = req.body;
      
      if (!input) {
        throw new BadRequestError('User data is required');
      }

      // Input can be a string (bulk) or an object (single)
      let usersToAdd: { name: string; email: string }[] = [];

      if (typeof input === 'string') {
        // Bulk parsing: "Name <email@example.com>" or "Name, email@example.com"
        // One per line or comma separated
        const lines = input.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
        
        for (const line of lines) {
          // Try to match "Name <email>"
          const bracketMatch = line.match(/^(.+)<(.+)>$/);
          if (bracketMatch) {
            usersToAdd.push({ name: bracketMatch[1].trim(), email: bracketMatch[2].trim() });
            continue;
          }

          // Try to match "Name, Email" or just "Email"
          // If it's a simple comma-less line, we assume it's an email or "Name Email"
          const parts = line.split(/\s+/);
          if (parts.length >= 2) {
            const email = parts[parts.length - 1];
            const name = parts.slice(0, parts.length - 1).join(' ');
            if (email.includes('@')) {
              usersToAdd.push({ name, email });
            }
          } else if (line.includes('@')) {
            usersToAdd.push({ name: line.split('@')[0], email: line });
          }
        }
      } else if (typeof input === 'object' && input.name && input.email) {
        usersToAdd = [{ name: input.name, email: input.email }];
      }

      if (usersToAdd.length === 0) {
        throw new BadRequestError('No valid users found in input');
      }

      const results = {
        added: 0,
        skipped: 0,
        errors: [] as string[],
      };

      for (const userData of usersToAdd) {
        try {
          // Check if user already exists
          const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
          if (existingUser) {
            results.skipped++;
            continue;
          }

          await User.create({
            name: userData.name,
            email: userData.email.toLowerCase(),
            role: UserRole.USER,
            unit: unitId || undefined,
            isApproved: false, // Default to pending
          });
          results.added++;
        } catch (error) {
          results.errors.push(`Failed to add ${userData.email}: ${(error as Error).message}`);
        }
      }

      res.status(201).json({
        success: true,
        message: `Processed ${usersToAdd.length} entries: ${results.added} added, ${results.skipped} skipped.`,
        data: results,
      });
    }
  );

  // Update user status (Approve/Reject)
  updateUserStatus = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      const { isApproved, rejectionReason, unitId } = req.body;

      const user = await User.findById(id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (isApproved !== undefined) {
        user.isApproved = isApproved;
        if (isApproved) {
          user.rejectionReason = undefined;
        } else if (rejectionReason) {
          user.rejectionReason = rejectionReason;
        }
      }

      if (unitId !== undefined) {
        user.unit = unitId === 'unassigned' ? undefined : unitId;
      }

      await user.save();

      res.status(200).json({
        success: true,
        message: `User status updated successfully`,
        data: user,
      });
    }
  );

  // Delete User
  deleteUser = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      const result = await User.findByIdAndDelete(id);
      if (!result) {
        throw new NotFoundError('User not found');
      }
      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    }
  );
}

export default new AdminController();
