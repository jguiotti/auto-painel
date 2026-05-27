"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

import { cn } from "@autopainel/shared/lib/utils";
import {
  Button,
  ScrollArea,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@autopainel/shared/ui";

export interface NotificationCenterItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  createdAt?: string;
  read?: boolean;
}

interface NotificationBellTriggerProps {
  unreadCount: number;
  onClick: () => void;
  className?: string;
}

export function NotificationBellTrigger({
  unreadCount,
  onClick,
  className,
}: NotificationBellTriggerProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("relative shrink-0", className)}
      aria-label={
        unreadCount > 0
          ? `Notificações, ${unreadCount} novas`
          : "Notificações"
      }
      onClick={onClick}
    >
      <Bell className="size-5" aria-hidden />
      {unreadCount > 0 ? (
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground shadow-sm"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Button>
  );
}

interface NotificationCenterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: NotificationCenterItem[];
  title: string;
  description: string;
  emptyMessage: string;
  footerLink?: { href: string; label: string };
  onItemActivate?: (item: NotificationCenterItem) => void;
  onMarkAllRead?: () => void;
  unreadCount?: number;
}

export function NotificationCenterSheet({
  open,
  onOpenChange,
  items,
  title,
  description,
  emptyMessage,
  footerLink,
  onItemActivate,
  onMarkAllRead,
  unreadCount = 0,
}: NotificationCenterSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-[100dvh] w-full max-w-md flex-col gap-0 border-l p-0 sm:max-w-md"
      >
        <SheetHeader className="shrink-0 space-y-1 border-b px-6 py-5 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>{description}</SheetDescription>
            </div>
            {unreadCount > 0 && onMarkAllRead ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 text-xs"
                onClick={onMarkAllRead}
              >
                Marcar todas como lidas
              </Button>
            ) : null}
          </div>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          {items.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted-foreground">{emptyMessage}</p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={cn(
                      "block px-6 py-4 transition-colors hover:bg-muted/60",
                      item.read ? "opacity-70" : "bg-muted/20",
                    )}
                    onClick={() => {
                      onItemActivate?.(item);
                      onOpenChange(false);
                    }}
                  >
                    <div className="flex items-start gap-2">
                      {!item.read ? (
                        <span
                          aria-hidden
                          className="mt-1.5 size-2 shrink-0 rounded-full bg-destructive"
                        />
                      ) : (
                        <span aria-hidden className="mt-1.5 size-2 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.subtitle}</p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        {footerLink ? (
          <div className="shrink-0 border-t border-border p-4">
            <Button variant="outline" className="w-full" asChild>
              <Link href={footerLink.href} onClick={() => onOpenChange(false)}>
                {footerLink.label}
              </Link>
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: NotificationCenterItem[];
  title: string;
  description: string;
  emptyMessage: string;
  footerLink?: { href: string; label: string };
  className?: string;
  onItemActivate?: (item: NotificationCenterItem) => void;
  onMarkAllRead?: () => void;
  unreadCount?: number;
}

export function NotificationCenter({
  open,
  onOpenChange,
  items,
  title,
  description,
  emptyMessage,
  footerLink,
  className,
  onItemActivate,
  onMarkAllRead,
  unreadCount,
}: NotificationCenterProps) {
  const resolvedUnread =
    unreadCount ?? items.filter((item) => !item.read).length;

  return (
    <div className={cn("relative no-print", className)}>
      <NotificationBellTrigger
        unreadCount={resolvedUnread}
        onClick={() => onOpenChange(true)}
      />

      <NotificationCenterSheet
        open={open}
        onOpenChange={onOpenChange}
        items={items}
        title={title}
        description={description}
        emptyMessage={emptyMessage}
        footerLink={footerLink}
        onItemActivate={onItemActivate}
        onMarkAllRead={onMarkAllRead}
        unreadCount={resolvedUnread}
      />
    </div>
  );
}
