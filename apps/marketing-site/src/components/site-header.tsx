import Link from "next/link";

import {
  Button,
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@autopainel/shared/ui";

const navLinkClass =
  "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted/50">
          <img
            src="/autopainel-logo.png"
            alt="AutoPainel"
            className="h-9 w-auto bg-transparent"
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
                <Link className={navLinkClass} href="/contato">
                  Contato
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            size="sm"
            className="bg-marketing-accent px-3 text-white hover:bg-marketing-accent/90 sm:px-4"
            asChild
          >
            <Link href="/contato">
              <span className="sm:hidden">Demo</span>
              <span className="hidden sm:inline">Agendar demonstração</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
