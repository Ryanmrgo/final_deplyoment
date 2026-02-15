import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    instructor: { type: String, required: true }, // Clerk user ID of teacher
    category: { type: String, default: 'General' },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    duration: { type: Number, default: 0 }, // in hours
    image: { type: String, default: '' }, // Cloudinary URL
    price: { type: Number, default: 0 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },
    status: { type: String, enum: ['Draft', 'Published', 'Archived'], default: 'Draft' },
    students: [{ type: String }], // Array of Clerk user IDs
    totalStudents: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: [
      {
        studentId: String,
        rating: Number,
        comment: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { minimize: false }
);

const Course = mongoose.models.course || mongoose.model('course', courseSchema);

export default Course;
