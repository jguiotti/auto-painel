import Link from "next/link";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@autopainel/shared/ui";

import { LOGO_HORIZONTAL_SRC } from "@/lib/brand";
import { MarketingHeaderDemoCta } from "@/components/marketing-tracked-ctas";

const navLinkClass =
  "text-sm font-medium text-zinc-400 transition-colors hover:text-white";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between px-4 sm:h-[4.5rem] sm:px-6">
        <Link
          href="/"
          className="flex items-center rounded-lg px-2 py-1 hover:bg-white/5"
        >
          <img
            src={LOGO_HORIZONTAL_SRC}
            alt="AutoPainel"
            className="h-10 w-auto max-w-[200px] object-contain sm:h-11 sm:max-w-[260px]"
            width={260}
            height={44}
          />
        </Link>
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="gap-2">
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link className={navLinkClass} href="/funcionalidades">
                  Funcionalidades
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link className={navLinkClass} href="/planos">
                  Planos
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link className={navLinkClass} href="/perguntas-frequentes">
                  FAQ
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <div className="flex items-center gap-2 sm:gap-3">
        <MarketingHeaderDemoCta />
        </div>
      </div>
    </header>
  );
}
