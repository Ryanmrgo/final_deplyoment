import mongoose, { HydratedDocument, Model, Schema } from 'mongoose';

export type NotificationRole = 'student' | 'teacher' | 'admin';
export type NotificationPriority = 'low' | 'medium' | 'high';
export type NotificationType =
  | 'enrollment.request_submitted'
  | 'enrollment.approved'
  | 'enrollment.rejected'
  | 'course.lesson_published'
  | 'assignment.created'
  | 'assignment.published'
  | 'assignment.submitted'
  | 'assignment.graded'
  | 'quiz.published'
  | 'quiz.submitted'
  | 'discussion.reply'
  | 'system.alert';
export type NotificationEntityType = 'course' | 'enrollmentRequest' | 'assignment' | 'quiz' | 'discussion' | 'system';

export interface Notification {
  recipientId: string;
  recipientRole: NotificationRole;
  type: NotificationType;
  title: string;
  message: string;
  entityType: NotificationEntityType;
  entityId?: string;
  actionUrl?: string;
  priority: NotificationPriority;
  isRead: boolean;
  readAt: Date | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationDocument = HydratedDocument<Notification>;
type NotificationModel = Model<Notification>;

const notificationSchema = new Schema<Notification, NotificationModel>(
  {
    recipientId: { type: String, required: true },
    recipientRole: { type: String, enum: ['student', 'teacher', 'admin'], required: true },
    type: {
      type: String,
      enum: [
        'enrollment.request_submitted',
        'enrollment.approved',
        'enrollment.rejected',
        'course.lesson_published',
        'assignment.created',
        'assignment.published',
        'assignment.submitted',
        'assignment.graded',
        'quiz.published',
        'quiz.submitted',
        'discussion.reply',
        'system.alert',
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    entityType: {
      type: String,
      enum: ['course', 'enrollmentRequest', 'assignment', 'quiz', 'discussion', 'system'],
      required: true,
    },
    entityId: { type: String, default: '' },
    actionUrl: { type: String, default: '' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false }
);

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });

const NotificationModelRef =
  (mongoose.models.notification as NotificationModel | undefined) ||
  mongoose.model<Notification, NotificationModel>('notification', notificationSchema);

export default NotificationModelRef;
