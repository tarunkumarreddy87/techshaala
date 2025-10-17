import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignment extends Document {
  _id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: Date;
  maxScore: number;
  createdAt: Date;
}

const AssignmentSchema: Schema = new Schema({
  _id: { type: String, required: true },
  courseId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  dueDate: { type: Date, required: true },
  maxScore: { type: Number, default: 100 },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

export default mongoose.model<IAssignment>('Assignment', AssignmentSchema);