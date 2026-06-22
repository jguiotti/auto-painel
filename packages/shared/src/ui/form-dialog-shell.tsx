"use client";

import * as React from "react";

import { cn } from "../lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { ScrollArea } from "./scroll-area";

const sizeClasses = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
} as const;

export interface FormDialogShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  size?: keyof typeof sizeClasses;
  formId: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  footer: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
  bodyClassName?: string;
}

export function FormDialogShell({
  open,
  onOpenChange,
  title,
  description,
  size = "md",
  formId,
  onSubmit,
  footer,
  children,
  contentClassName,
  bodyClassName,
}: FormDialogShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[min(90vh,720px)] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:w-full",
          sizeClasses[size],
          contentClassName,
        )}
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-border/60 px-6 py-5 text-left">
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription className="text-pretty">{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1 [&>[data-slot=scroll-area-scrollbar]]:w-1.5">
          <form
            id={formId}
            onSubmit={onSubmit}
            className={cn("px-6 py-5", bodyClassName)}
          >
            {children}
          </form>
        </ScrollArea>

        <DialogFooter className="shrink-0 border-t border-border/60 bg-muted/20 px-6 py-4 sm:justify-end">
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
