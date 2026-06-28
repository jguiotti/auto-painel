"use client";

import { useEffect, useId, useState } from "react";

import { cn } from "../lib/utils";
import { Label } from "./label";

export interface FileUploadFieldProps {
  name: string;
  label: string;
  hint?: string;
  accept?: string;
  disabled?: boolean;
  /** Existing remote URL shown when no local file is selected. */
  initialRemoteUrl?: string;
  /** Optional hidden input name to persist remote URL on form submit. */
  hiddenUrlName?: string;
  className?: string;
  inputClassName?: string;
  previewClassName?: string;
  /** Applied to the preview image (e.g. rounded avatar). */
  previewImageClassName?: string;
  /** Called when the user selects or clears a local file. */
  onFileSelected?: (file: File | null) => void;
}

export function FileUploadField({
  name,
  label,
  hint,
  accept = "image/jpeg,image/png,image/webp,image/gif",
  disabled,
  initialRemoteUrl = "",
  hiddenUrlName,
  className,
  inputClassName,
  previewClassName,
  previewImageClassName,
  onFileSelected,
}: FileUploadFieldProps) {
  const inputId = useId();
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setPreview((prev) => {
        if (prev?.startsWith("blob:")) {
          URL.revokeObjectURL(prev);
        }
        return null;
      });
      onFileSelected?.(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview((prev) => {
      if (prev?.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return url;
    });
    onFileSelected?.(file);
  }

  const remoteSrc = initialRemoteUrl.length > 0 ? initialRemoteUrl : null;
  const displaySrc = preview ?? remoteSrc;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={inputId}>{label}</Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {hiddenUrlName ? (
        <input
          type="hidden"
          name={hiddenUrlName}
          defaultValue={initialRemoteUrl}
          key={`${hiddenUrlName}:${initialRemoteUrl}`}
        />
      ) : null}
      <input
        id={inputId}
        name={name}
        type="file"
        accept={accept}
        disabled={disabled}
        className={cn(
          "block w-full cursor-pointer text-sm text-foreground file:mr-4 file:rounded-md file:border-0 file:bg-muted file:px-4 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/80",
          inputClassName,
        )}
        onChange={onFileChange}
      />
      {displaySrc ? (
        <div
          className={cn(
            "rounded-md border border-border bg-muted/20 p-3",
            previewClassName,
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- blob previews and remote storage URLs */}
          <img
            src={displaySrc}
            alt=""
            className={cn(
              "mx-auto max-h-28 max-w-full object-contain",
              previewImageClassName,
            )}
          />
        </div>
      ) : null}
    </div>
  );
}
