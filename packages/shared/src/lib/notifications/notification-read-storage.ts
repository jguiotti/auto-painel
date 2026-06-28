const STORAGE_PREFIX = "autopainel:notifications-read:";
const DISMISSED_STORAGE_PREFIX = "autopainel:notifications-dismissed:";

function storageKey(scope: string): string {
  return `${STORAGE_PREFIX}${scope}`;
}

function dismissedStorageKey(scope: string): string {
  return `${DISMISSED_STORAGE_PREFIX}${scope}`;
}

function loadIdSet(storageKeyName: string): Set<string> {
  if (typeof window === "undefined") {
    return new Set();
  }
  try {
    const raw = window.localStorage.getItem(storageKeyName);
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

function persistIdSet(storageKeyName: string, ids: Set<string>): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(storageKeyName, JSON.stringify([...ids]));
}

export function loadReadNotificationIds(scope: string): Set<string> {
  return loadIdSet(storageKey(scope));
}

export function loadDismissedNotificationIds(scope: string): Set<string> {
  return loadIdSet(dismissedStorageKey(scope));
}

export function persistReadNotificationIds(scope: string, ids: Set<string>): void {
  persistIdSet(storageKey(scope), ids);
}

export function persistDismissedNotificationIds(scope: string, ids: Set<string>): void {
  persistIdSet(dismissedStorageKey(scope), ids);
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

export function dismissNotification(scope: string, id: string): Set<string> {
  const next = loadDismissedNotificationIds(scope);
  next.add(id);
  persistDismissedNotificationIds(scope, next);
  return next;
}
