"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check, Trash2 } from "lucide-react";

import {
  deletePlatformAdminNotificationAction,
  markAllPlatformAdminNotificationsReadAction,
  markPlatformAdminNotificationReadAction,
} from "@/actions/platform-admin-notifications";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@autopainel/shared/ui";
import type { NotificationCenterItem } from "@autopainel/shared/ui";

interface AdminNotificationsInboxClientProps {
  items: NotificationCenterItem[];
}

export function AdminNotificationsInboxClient({ items }: AdminNotificationsInboxClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function runAction(action: () => Promise<{ error?: string } | { count?: number }>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Notificações</h1>
          <p className="text-sm text-muted-foreground">
            Trial, upgrades, contratos, suporte e alertas operacionais.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending || items.every((item) => item.read)}
          onClick={() => runAction(markAllPlatformAdminNotificationsReadAction)}
        >
          Marcar todas como lidas
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inbox da plataforma</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma notificação no momento.</p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {!item.read ? (
                      <span
                        aria-hidden
                        className="size-2 shrink-0 rounded-full bg-destructive"
                      />
                    ) : null}
                    <p className="font-medium">{item.title}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.subtitle}</p>
                  {item.createdAt ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString("pt-BR")}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!item.read ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() =>
                        runAction(() => markPlatformAdminNotificationReadAction(item.id))
                      }
                    >
                      <Check className="mr-2 size-4" />
                      Marcar lida
                    </Button>
                  ) : null}
                  <Button type="button" variant="outline" size="sm" asChild>
                    <Link href={item.href}>Abrir</Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={isPending}
                    aria-label={`Excluir notificação «${item.title}»`}
                    onClick={() =>
                      runAction(() => deletePlatformAdminNotificationAction(item.id))
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
