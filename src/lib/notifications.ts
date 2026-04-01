import Notification, {
  NotificationEntityType,
  NotificationPriority,
  NotificationRole,
  NotificationType,
} from '@/models/Notification';

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

