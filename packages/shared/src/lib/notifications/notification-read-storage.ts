const STORAGE_PREFIX = "autopainel:notifications-read:";

function storageKey(scope: string): string {
  return `${STORAGE_PREFIX}${scope}`;
}

export function loadReadNotificationIds(scope: string): Set<string> {
  if (typeof window === "undefined") {
    return new Set();
  }
  try {
    const raw = window.localStorage.getItem(storageKey(scope));
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return new Set();
    }
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

export function persistReadNotificationIds(scope: string, ids: Set<string>): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(storageKey(scope), JSON.stringify([...ids]));
}

export function markNotificationRead(scope: string, id: string): Set<string> {
  const next = loadReadNotificationIds(scope);
  next.add(id);
  persistReadNotificationIds(scope, next);
  return next;
}

export function markAllNotificationsRead(scope: string, ids: string[]): Set<string> {
  const next = loadReadNotificationIds(scope);
  for (const id of ids) {
    next.add(id);
  }
  persistReadNotificationIds(scope, next);
  return next;
}
