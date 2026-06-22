"use client";

import { FileUploadField } from "@autopainel/shared/ui";

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
  return (
    <FileUploadField
      name={fileInputName}
      hiddenUrlName={hiddenUrlName}
      label={label}
      hint={description}
      initialRemoteUrl={initialRemoteUrl}
      disabled={disabled}
    />
  );
}
