"use client";

import { useCallback, useMemo, useState } from "react";

import {
  dismissNotification,
  loadDismissedNotificationIds,
  loadReadNotificationIds,
  markAllNotificationsRead,
  markNotificationRead,
} from "@autopainel/shared/lib/notifications/notification-read-storage";
import type { NotificationCenterItem } from "@autopainel/shared/ui";

export function useNotificationReadState(scope: string, items: NotificationCenterItem[]) {
  const [readIds, setReadIds] = useState<Set<string>>(() => loadReadNotificationIds(scope));
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() =>
    loadDismissedNotificationIds(scope),
  );

  const visibleItems = useMemo(
    () => items.filter((item) => !dismissedIds.has(item.id)),
    [dismissedIds, items],
  );

  const itemsWithRead = useMemo(
    () =>
      visibleItems.map((item) => ({
        ...item,
        read: item.read ?? readIds.has(item.id),
      })),
    [readIds, visibleItems],
  );

  const unreadCount = useMemo(
    () => itemsWithRead.filter((item) => !item.read).length,
    [itemsWithRead],
  );

  const markRead = useCallback(
    (id: string) => {
      setReadIds(markNotificationRead(scope, id));
    },
    [scope],
  );

  const markAllRead = useCallback(() => {
    setReadIds(markAllNotificationsRead(scope, visibleItems.map((item) => item.id)));
  }, [scope, visibleItems]);

  const dismiss = useCallback(
    (id: string) => {
      setDismissedIds(dismissNotification(scope, id));
    },
    [scope],
  );

  const handleItemActivate = useCallback(
    (item: NotificationCenterItem) => {
      markRead(item.id);
    },
    [markRead],
  );

  return {
    itemsWithRead,
    unreadCount,
    markRead,
    markAllRead,
    dismiss,
    handleItemActivate,
  };
}
