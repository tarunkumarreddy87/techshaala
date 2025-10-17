import mongoose, { Schema, Document } from 'mongoose';

export interface ICourse extends Document {
  _id: string;
  title: string;
  description: string;
  duration: string;
  teacherId: string;
  createdAt: Date;
}

const CourseSchema: Schema = new Schema({
  _id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: String, required: true },
  teacherId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

export default mongoose.model<ICourse>('Course', CourseSchema);