"use client";

import googleFontFamilies from "@autopainel/shared/data/google-fonts-families.json";
import { Button, Input, Label } from "@autopainel/shared/ui";
import { ChevronDown, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

/** Alphabetically sorted catalogue from Google Fonts open metadata (~1900 sans/disp families). */
const ALL_FAMILIES = googleFontFamilies as readonly string[];

const MAX_RESULTS = 120;

interface GoogleFontFamilyComboboxProps {
  idPrefix: string;
  formFieldName: string;
  label: string;
  description: string;
  initialFamily: string;
  disabled?: boolean;
}

export function GoogleFontFamilyCombobox({
  idPrefix,
  formFieldName,
  label,
  description,
  initialFamily,
  disabled,
}: GoogleFontFamilyComboboxProps) {
  const inputId = `${idPrefix}-search`;
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(initialFamily.trim());
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelected(initialFamily.trim());
  }, [initialFamily]);

  useEffect(() => {
    function onDocPointer(ev: MouseEvent) {
      if (!wrapperRef.current?.contains(ev.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onDocPointer);
    return () => document.removeEventListener("pointerdown", onDocPointer);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return ALL_FAMILIES.slice(0, MAX_RESULTS);
    }
    const hits: string[] = [];
    for (const name of ALL_FAMILIES) {
      if (name.toLowerCase().includes(q)) {
        hits.push(name);
      }
      if (hits.length >= MAX_RESULTS) {
        break;
      }
    }
    return hits;
  }, [query]);

  return (
    <div ref={wrapperRef} className="space-y-2">
      <input type="hidden" name={formFieldName} value={selected} readOnly />
      <Label htmlFor={inputId}>{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-w-[12rem] max-w-full justify-between text-left font-normal"
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="truncate">
            {selected.length > 0 ? selected : "(Sistema / padrão)"}
          </span>
          <ChevronDown className="ml-2 size-4 shrink-0 opacity-60" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 gap-1"
          disabled={disabled || selected.length === 0}
          onClick={() => setSelected("")}
        >
          <X className="size-3.5" aria-hidden />
          Limpar
        </Button>
      </div>
      {open ? (
        <div className="relative z-[60] w-full rounded-md border border-border bg-popover shadow-md outline-none md:max-w-md">
          <div className="border-b border-border p-2">
            <Input
              id={inputId}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar pelo nome da família…"
              autoComplete="off"
              className="h-9"
              disabled={disabled}
            />
          </div>
          <ul role="listbox" className="max-h-60 overflow-y-auto py-1 text-sm">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-muted-foreground">
                Sem resultados neste nome.
              </li>
            ) : (
              filtered.map((fam) => (
                <li key={fam} role="option" aria-selected={fam === selected}>
                  <button
                    type="button"
                    disabled={disabled}
                    className="flex w-full items-center px-3 py-1.5 text-left hover:bg-accent hover:text-accent-foreground disabled:opacity-40"
                    onClick={() => {
                      setSelected(fam);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    {fam}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
