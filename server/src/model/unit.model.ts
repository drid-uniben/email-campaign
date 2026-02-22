import mongoose, { Document, Schema } from 'mongoose';

export interface IUnit extends Document {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UnitSchema: Schema<IUnit> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Unit name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUnit>('Unit', UnitSchema);
