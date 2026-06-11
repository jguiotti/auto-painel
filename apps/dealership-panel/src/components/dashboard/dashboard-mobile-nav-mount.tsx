"use client";

import { Menu } from "lucide-react";
import { useSyncExternalStore } from "react";

import { Button } from "@autopainel/shared/ui";

import { DashboardMobileNav } from "@/components/dashboard/DashboardMobileNav";

interface DashboardMobileNavMountProps {
  primaryNav: Array<{ href: string; label: string; description: string }>;
  optionalNav: Array<{ href: string; label: string; description: string }>;
  storefrontUrl: string;
}

function subscribeToClientMount() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function DashboardMobileNavMount(props: DashboardMobileNavMountProps) {
  const mounted = useSyncExternalStore(
    subscribeToClientMount,
    getClientSnapshot,
    getServerSnapshot,
  );

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2 lg:hidden"
        disabled
        aria-hidden
        tabIndex={-1}
      >
        <Menu className="size-4" aria-hidden />
        Menu
      </Button>
    );
  }

  return <DashboardMobileNav {...props} />;
}
