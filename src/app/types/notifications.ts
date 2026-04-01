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

export interface NotificationItem {
  id: string;
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
  readAt: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
