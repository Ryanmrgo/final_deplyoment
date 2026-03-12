import mongoose, { HydratedDocument, Model, Schema } from 'mongoose';

export interface DiscussionReply {
  teacherId: string;
  message: string;
  createdAt: Date;
}

export interface Discussion {
  courseId: mongoose.Types.ObjectId;
  studentId: string;
  question: string;
  resolved: boolean;
  replies: DiscussionReply[];
  createdAt: Date;
  updatedAt: Date;
}

export type DiscussionDocument = HydratedDocument<Discussion>;

type DiscussionModel = Model<Discussion>;

const discussionReplySchema = new Schema<DiscussionReply>(
  {
    teacherId: { type: String, required: true },
    message: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const discussionSchema = new Schema<Discussion, DiscussionModel>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'course', required: true, index: true },
    studentId: { type: String, required: true, index: true },
    question: { type: String, required: true, trim: true },
    resolved: { type: Boolean, default: false },
    replies: { type: [discussionReplySchema], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { minimize: false }
);

discussionSchema.index({ courseId: 1, createdAt: -1 });

const DiscussionModelRef =
  (mongoose.models.discussion as DiscussionModel | undefined) ||
  mongoose.model<Discussion, DiscussionModel>('discussion', discussionSchema);

export default DiscussionModelRef;
