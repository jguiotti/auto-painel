"use client";

import { Label } from "@autopainel/shared/ui";
import { useEffect, useId, useState } from "react";

interface DealershipBrandUploadProps {
  fileInputName: string;
  hiddenUrlName: string;
  label: string;
  description: string;
  initialRemoteUrl: string;
  disabled?: boolean;
}

export function DealershipBrandUpload({
  fileInputName,
  hiddenUrlName,
  label,
  description,
  initialRemoteUrl,
  disabled,
}: DealershipBrandUploadProps) {
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
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview((prev) => {
      if (prev?.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return url;
    });
  }

  const remoteSrc =
    initialRemoteUrl.length > 0 ? initialRemoteUrl : null;
  const displaySrc = preview ?? remoteSrc;

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
      <input
        type="hidden"
        name={hiddenUrlName}
        defaultValue={initialRemoteUrl}
        key={`${hiddenUrlName}:${initialRemoteUrl}`}
      />
      <input
        id={inputId}
        name={fileInputName}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        disabled={disabled}
        className="block w-full cursor-pointer text-sm text-foreground file:mr-4 file:rounded-md file:border-0 file:bg-muted file:px-4 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/80"
        onChange={onFileChange}
      />
      {displaySrc ? (
        <div className="rounded-md border border-border bg-muted/20 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote Storage URLs / blob previews */}
          <img
            src={displaySrc}
            alt=""
            className="mx-auto max-h-28 max-w-full object-contain"
          />
        </div>
      ) : null}
    </div>
  );
}
