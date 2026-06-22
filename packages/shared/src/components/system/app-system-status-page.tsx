import type { LucideIcon } from "lucide-react";
import { AlertTriangle, FileQuestion, ServerCrash } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "../../lib/utils";
import { Button } from "../../ui/button";

export type AppSystemStatusTone = "admin" | "marketing" | "storefront" | "panel";

export type AppSystemStatusKind = "not-found" | "server-error" | "forbidden";

interface AppSystemStatusAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface AppSystemStatusPageProps {
  kind: AppSystemStatusKind;
  tone?: AppSystemStatusTone;
  title?: string;
  description?: string;
  codeLabel?: string;
  primaryAction?: AppSystemStatusAction;
  secondaryAction?: AppSystemStatusAction;
  children?: ReactNode;
  className?: string;
}

const KIND_DEFAULTS: Record<
  AppSystemStatusKind,
  { icon: LucideIcon; code: string; title: string; description: string }
> = {
  "not-found": {
    icon: FileQuestion,
    code: "404",
    title: "Página não encontrada",
    description:
      "O endereço que você abriu não existe ou foi movido. Verifique o link ou volte ao início.",
  },
  "server-error": {
    icon: ServerCrash,
    code: "500",
    title: "Algo deu errado",
    description:
      "Encontramos um problema temporário no servidor. Tente novamente em instantes ou volte ao início.",
  },
  forbidden: {
    icon: AlertTriangle,
    code: "403",
    title: "Acesso não permitido",
    description:
      "Sua conta não tem permissão para ver este conteúdo. Se acredita que isso é um engano, fale com o suporte.",
  },
};

const TONE_STYLES: Record<
  AppSystemStatusTone,
  {
    shell: string;
    card: string;
    muted: string;
    code: string;
    primaryButton?: string;
    outlineButton?: string;
  }
> = {
  admin: {
    shell: "bg-muted/40 text-foreground",
    card: "border-border bg-card text-card-foreground shadow-lg",
    muted: "text-muted-foreground",
    code: "text-muted-foreground/70",
  },
  marketing: {
    shell: "bg-zinc-950 text-zinc-100",
    card: "border-white/10 bg-zinc-900/80 text-zinc-100",
    muted: "text-zinc-400",
    code: "text-zinc-600",
  },
  storefront: {
    shell: "bg-zinc-950 text-zinc-100",
    card: "border-white/10 bg-zinc-900/80 text-zinc-100",
    muted: "text-zinc-400",
    code: "text-zinc-600",
  },
  panel: {
    shell: "bg-zinc-50 text-zinc-900 [color-scheme:light]",
    card: "border-zinc-200 bg-white text-zinc-900 shadow-sm",
    muted: "text-zinc-600",
    code: "text-zinc-400",
    primaryButton:
      "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-900 dark:text-white",
    outlineButton:
      "border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-300 dark:bg-white dark:text-zinc-900",
  },
};

function StatusActionButton({
  action,
  variant,
  tone,
}: {
  action: AppSystemStatusAction;
  variant: "default" | "outline";
  tone: AppSystemStatusTone;
}) {
  const styles = TONE_STYLES[tone];
  const extraClassName =
    variant === "default" ? styles.primaryButton : styles.outlineButton;

  if (action.href) {
    return (
      <Button variant={variant} className={extraClassName} asChild>
        <Link href={action.href}>{action.label}</Link>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      className={extraClassName}
      onClick={action.onClick}
    >
      {action.label}
    </Button>
  );
}

export function AppSystemStatusPage({
  kind,
  tone = "admin",
  title,
  description,
  codeLabel,
  primaryAction,
  secondaryAction,
  children,
  className,
}: AppSystemStatusPageProps) {
  const defaults = KIND_DEFAULTS[kind];
  const styles = TONE_STYLES[tone];
  const Icon = defaults.icon;

  return (
    <main
      className={cn(
        "flex min-h-screen flex-col items-center justify-center px-4 py-16",
        styles.shell,
        className,
      )}
    >
      <div className={cn("w-full max-w-lg rounded-2xl border p-8 text-center", styles.card)}>
        <p className={cn("text-5xl font-semibold tracking-tight", styles.code)} aria-hidden>
          {codeLabel ?? defaults.code}
        </p>
        <div
          className={cn(
            "mx-auto mt-4 flex size-12 items-center justify-center rounded-full",
            tone === "panel" ? "bg-zinc-100" : "bg-muted/60",
          )}
        >
          <Icon
            className={cn("size-6", tone === "panel" ? "text-zinc-500" : "text-muted-foreground")}
            aria-hidden
          />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">{title ?? defaults.title}</h1>
        <p className={cn("mt-3 text-sm leading-relaxed", styles.muted)}>
          {description ?? defaults.description}
        </p>
        {children}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {primaryAction ? (
            <StatusActionButton action={primaryAction} variant="default" tone={tone} />
          ) : null}
          {secondaryAction ? (
            <StatusActionButton action={secondaryAction} variant="outline" tone={tone} />
          ) : null}
        </div>
      </div>
    </main>
  );
}
