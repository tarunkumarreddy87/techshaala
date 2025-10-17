import mongoose, { Schema, Document } from 'mongoose';

export interface ISubmission extends Document {
  _id: string;
  assignmentId: string;
  studentId: string;
  content: string;
  submittedAt: Date;
}

const SubmissionSchema: Schema = new Schema({
  _id: { type: String, required: true },
  assignmentId: { type: String, required: true },
  studentId: { type: String, required: true },
  content: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now }
}, { _id: false });

export default mongoose.model<ISubmission>('Submission', SubmissionSchema);