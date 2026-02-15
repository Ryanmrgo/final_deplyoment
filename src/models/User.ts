import mongoose from 'mongoose';

export type UserRole = 'teacher' | 'student';

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // Clerk user ID
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    imageUrl: { type: String, default: '' },
    role: { type: String, enum: ['teacher', 'student', 'admin'], default: 'student' },
    bio: { type: String, default: '' },
    headline: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { minimize: false }
);

const User = mongoose.models.user || mongoose.model('user', userSchema);

export default User;
