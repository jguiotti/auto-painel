"use client";

import { useCallback, useMemo, useState } from "react";

import {
  loadReadNotificationIds,
  markAllNotificationsRead,
  markNotificationRead,
} from "@autopainel/shared/lib/notifications/notification-read-storage";
import type { NotificationCenterItem } from "@autopainel/shared/ui";

export function useNotificationReadState(scope: string, items: NotificationCenterItem[]) {
  const [readIds, setReadIds] = useState<Set<string>>(() => loadReadNotificationIds(scope));

  const itemsWithRead = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        read: item.read ?? readIds.has(item.id),
      })),
    [items, readIds],
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
    setReadIds(markAllNotificationsRead(scope, items.map((item) => item.id)));
  }, [items, scope]);

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
    handleItemActivate,
  };
}
