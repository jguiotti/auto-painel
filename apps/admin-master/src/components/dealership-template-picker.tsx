"use client";

import { StorefrontLayoutPicker } from "@autopainel/shared/ui";
import type { StorefrontLayoutTemplateId } from "@autopainel/shared/types";

export function DealershipTemplatePicker({
  value,
  onChange,
  disabled,
}: {
  value: StorefrontLayoutTemplateId;
  onChange: (next: StorefrontLayoutTemplateId) => void;
  disabled?: boolean;
}) {
  return (
    <StorefrontLayoutPicker
      value={value}
      onChange={onChange}
      disabled={disabled}
      labelMode="admin"
    />
  );
}
