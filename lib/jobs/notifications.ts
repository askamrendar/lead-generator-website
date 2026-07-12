// Phase 8.5 — Notification center service. In-app notifications for the single owner.
import { prisma } from '@/lib/db/prisma';

export type NotificationLevel = 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO';

export interface NotifyInput {
  userId: string;
  level?: NotificationLevel;
  title: string;
  body?: string;
}

export async function notify(input: NotifyInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      level: input.level ?? 'INFO',
      title: input.title,
      body: input.body,
    },
  });
}

export async function listNotifications(userId: string, limit = 30) {
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);
  return { items, unread };
}

export async function markRead(userId: string, id: string) {
  // Scope by userId so one user can't mark another's notifications.
  await prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
}
