import { Request, Response } from 'express';
import Unit from '../../model/unit.model';
import User from '../../model/user.model';
import asyncHandler from '../../utils/asyncHandler';
import { BadRequestError, NotFoundError } from '../../utils/customErrors';
import logger from '../../utils/logger';

class UnitController {
  // Create a new unit
  createUnit = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { name, description } = req.body;

      if (!name) {
        throw new BadRequestError('Unit name is required');
      }

      const existingUnit = await Unit.findOne({ name });
      if (existingUnit) {
        throw new BadRequestError('Unit with this name already exists');
      }

      const unit = await Unit.create({ name, description });

      logger.info(`Admin created unit: ${name}`);

      res.status(201).json({
        success: true,
        message: 'Unit created successfully',
        data: unit,
      });
    }
  );

  // Get all units
  getAllUnits = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const units = await Unit.find().sort({ name: 1 }).lean();

      res.status(200).json({
        success: true,
        data: units,
      });
    }
  );

  // Get single unit by ID
  getUnitById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      const unit = await Unit.findById(id).lean();
      if (!unit) {
        throw new NotFoundError('Unit not found');
      }

      res.status(200).json({
        success: true,
        data: unit,
      });
    }
  );

  // Update a unit (Rename)
  updateUnit = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      const { name, description } = req.body;

      const unit = await Unit.findById(id);
      if (!unit) {
        throw new NotFoundError('Unit not found');
      }

      if (name && name !== unit.name) {
        const existingUnit = await Unit.findOne({ name });
        if (existingUnit) {
          throw new BadRequestError('Unit with this name already exists');
        }
        unit.name = name;
      }

      if (description !== undefined) {
        unit.description = description;
      }

      await unit.save();

      logger.info(`Admin updated unit: ${id} (${unit.name})`);

      res.status(200).json({
        success: true,
        message: 'Unit updated successfully',
        data: unit,
      });
    }
  );

  // Delete a unit
  deleteUnit = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;

      const unit = await Unit.findById(id);
      if (!unit) {
        throw new NotFoundError('Unit not found');
      }

      // Handle users currently in this unit (set to null)
      await User.updateMany({ unit: id }, { $set: { unit: undefined } });

      await Unit.deleteOne({ _id: id });

      logger.info(`Admin deleted unit: ${id} (${unit.name})`);

      res.status(200).json({
        success: true,
        message: 'Unit deleted successfully',
      });
    }
  );
}

export default new UnitController();
