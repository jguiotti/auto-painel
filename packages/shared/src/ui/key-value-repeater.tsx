"use client";

import { cn } from "../lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

export interface KeyValueRepeaterRow {
  key: string;
  value: string;
}

export interface KeyValueRepeaterProps {
  rows: KeyValueRepeaterRow[];
  keyLabel: string;
  valueLabel: string;
  onChange: (rows: KeyValueRepeaterRow[]) => void;
  minRows?: number;
  maxRows?: number;
  addRowLabel?: string;
  disabled?: boolean;
  className?: string;
  /** Prefix for row labels, e.g. «Indicador» → «Indicador 1». */
  rowLegendPrefix?: string;
  inputClassName?: string;
}

export function KeyValueRepeater({
  rows,
  keyLabel,
  valueLabel,
  onChange,
  minRows = 0,
  maxRows = 8,
  addRowLabel = "Adicionar linha",
  disabled,
  className,
  rowLegendPrefix,
  inputClassName,
}: KeyValueRepeaterProps) {
  function patchRow(index: number, field: "key" | "value", next: string) {
    const copy = [...rows];
    copy[index] = { ...copy[index], [field]: next };
    onChange(copy);
  }

  function removeRow(index: number) {
    if (rows.length <= minRows) {
      return;
    }
    onChange(rows.filter((_, rowIndex) => rowIndex !== index));
  }

  function addRow() {
    if (rows.length >= maxRows) {
      return;
    }
    onChange([...rows, { key: "", value: "" }]);
  }

  const canAdd = rows.length < maxRows;
  const canRemove = rows.length > minRows;

  return (
    <div className={cn("space-y-3", className)}>
      {rows.map((row, index) => (
        <div key={`kv-row-${index}`} className="space-y-2">
          {rowLegendPrefix ? (
            <p className="text-xs font-medium text-muted-foreground">
              {rowLegendPrefix} {index + 1}
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{keyLabel}</Label>
              <Input
                value={row.key}
                disabled={disabled}
                className={inputClassName}
                onChange={(event) => patchRow(index, "key", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{valueLabel}</Label>
              <Input
                value={row.value}
                disabled={disabled}
                className={inputClassName}
                onChange={(event) => patchRow(index, "value", event.target.value)}
              />
            </div>
          </div>
          {canRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => removeRow(index)}
            >
              Remover
            </Button>
          ) : null}
        </div>
      ))}
      {canAdd && minRows !== maxRows ? (
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={addRow}>
          {addRowLabel}
        </Button>
      ) : null}
    </div>
  );
}
