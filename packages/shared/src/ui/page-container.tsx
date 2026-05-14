import type { HTMLAttributes } from "react";

import { cn } from "../lib/utils";

interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "md" | "lg" | "xl";
}

const sizeClass: Record<NonNullable<PageContainerProps["size"]>, string> = {
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
};

export function PageContainer({
  size = "xl",
  className,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", sizeClass[size], className)}
      {...props}
    />
  );
}
