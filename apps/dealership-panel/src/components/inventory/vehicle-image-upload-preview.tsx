"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

interface VehicleImageUploadPreviewProps {
  inputId: string;
  inputName: string;
  label: string;
  description: string;
  disabled?: boolean;
  onFilesChange?: (count: number) => void;
}

export function VehicleImageUploadPreview({
  inputId,
  inputName,
  label,
  description,
  disabled = false,
  onFilesChange,
}: VehicleImageUploadPreviewProps) {
  const [files, setFiles] = useState<File[]>([]);
  const previews = useMemo(
    () =>
      files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [files],
  );

  useEffect(() => {
    return () => {
      for (const preview of previews) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [previews]);

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-input bg-muted/30 p-4">
      <div>
        <label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </label>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <input
        id={inputId}
        name={inputName}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        disabled={disabled}
        className="flex h-10 w-full cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
        onChange={(event) => {
          const nextFiles = Array.from(event.currentTarget.files ?? []);
          setFiles(nextFiles);
          onFilesChange?.(nextFiles.length);
        }}
      />
      {previews.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {previews.map((preview, index) => (
            <li key={`${preview.file.name}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border">
              <Image
                src={preview.url}
                alt={`Pré-visualização ${index + 1}`}
                fill
                className="object-cover"
                sizes="160px"
                unoptimized
              />
              <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                {index + 1}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
