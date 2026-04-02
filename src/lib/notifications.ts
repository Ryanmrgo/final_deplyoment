import connectDB from '@/config/db';
import Notification, {
  NotificationEntityType,
  NotificationPriority,
  NotificationRole,
  NotificationType,
} from '@/models/Notification';
import Enrollment from '@/models/Enrollment';
import mongoose from 'mongoose';

export interface CreateNotificationInput {
  recipientId: string;
  recipientRole: NotificationRole;
  type: NotificationType;
  title: string;
  message: string;
  entityType: NotificationEntityType;
  entityId?: string;
  actionUrl?: string;
  priority?: NotificationPriority;
  metadata?: Record<string, unknown>;
}

export async function createNotification(input: CreateNotificationInput) {
  await Notification.create({
    ...input,
    priority: input.priority || 'medium',
    entityId: input.entityId || '',
    actionUrl: input.actionUrl || '',
  });
}

export async function createNotificationsBulk(inputs: CreateNotificationInput[]) {
  if (inputs.length === 0) return;
  await Notification.insertMany(
    inputs.map((item) => ({
      ...item,
      priority: item.priority || 'medium',
      entityId: item.entityId || '',
      actionUrl: item.actionUrl || '',
    }))
  );
}

/** Notify active enrolled students when a lesson is published (best-effort; errors logged only). */
export async function notifyEnrolledStudentsLessonPublished(opts: {
  courseId: string;
  courseTitle: string;
  lessonTitle: string;
  lessonId: string;
}) {
  try {
    await connectDB();
    const courseOid = new mongoose.Types.ObjectId(opts.courseId);
    const enrollments = await Enrollment.find({ courseId: courseOid, status: 'Active' })
      .select('studentId')
      .lean();
    const studentIds = [
      ...new Set(enrollments.map((e: { studentId?: string }) => String(e.studentId)).filter(Boolean)),
    ];
    if (studentIds.length === 0) return;

    const lt = opts.lessonTitle.trim().slice(0, 120) || 'Lesson';
    const ct = opts.courseTitle.trim().slice(0, 120) || 'Course';
    const msg = `New lesson "${lt}" is available in "${ct}".`;
    const message = msg.length > 500 ? `${msg.slice(0, 497)}…` : msg;
    const title = `New lesson: ${lt}`.slice(0, 120);

    await createNotificationsBulk(
      studentIds.map((recipientId) => ({
        recipientId,
        recipientRole: 'student' as const,
        type: 'course.lesson_published' as const,
        title,
        message,
        entityType: 'course' as const,
        entityId: opts.courseId,
        actionUrl: `/courses/${opts.courseId}`,
        priority: 'medium' as const,
        metadata: { courseId: opts.courseId, lessonId: opts.lessonId },
      }))
    );
  } catch (e) {
    console.error('notifyEnrolledStudentsLessonPublished:', e);
  }
}

