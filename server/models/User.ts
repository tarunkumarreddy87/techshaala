import mongoose, { Schema, Document } from 'mongoose';
import { User } from '@shared/schema';

export interface IUser extends Document, Omit<User, 'id'> {
  _id: string;
}

const UserSchema: Schema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher'], required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

export default mongoose.model<IUser>('User', UserSchema);