import mongoose, { Schema, Document } from 'mongoose';

export interface IEnrollment extends Document {
  _id: string;
  studentId: string;
  courseId: string;
  enrolledAt: Date;
}

const EnrollmentSchema: Schema = new Schema({
  _id: { type: String, required: true },
  studentId: { type: String, required: true },
  courseId: { type: String, required: true },
  enrolledAt: { type: Date, default: Date.now }
}, { _id: false });

export default mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);