import mongoose, { Schema, Document } from 'mongoose';

export interface IGrade extends Document {
  _id: string;
  submissionId: string;
  score: number;
  feedback: string;
  gradedAt: Date;
}

const GradeSchema: Schema = new Schema({
  _id: { type: String, required: true },
  submissionId: { type: String, required: true, unique: true },
  score: { type: Number, required: true },
  feedback: { type: String },
  gradedAt: { type: Date, default: Date.now }
}, { _id: false });

export default mongoose.model<IGrade>('Grade', GradeSchema);