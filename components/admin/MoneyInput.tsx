"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/materials/format";

type MoneyInputProps = {
  value: number;
  onChange: (value: number) => void;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  min?: number;
  step?: number;
};

function parseMoneyInput(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) return 0;

  // Soporta "1234.56", "1234,56" y pegado con "$ "
  let cleaned = trimmed.replace(/\$/g, "").replace(/\s/g, "");
  if (cleaned.includes(",") && cleaned.includes(".")) {
    // Formato AR: 1.234,56
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    cleaned = cleaned.replace(",", ".");
  }

  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function toEditValue(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "";
  return String(Math.round(value * 100) / 100);
}

export default function MoneyInput({
  value,
  onChange,
  readOnly = false,
  placeholder = "0",
  className = "",
  min = 0,
  step = 0.01,
}: MoneyInputProps) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");

  if (readOnly) {
    return (
      <input
        type="text"
        value={value > 0 ? formatPrice(value) : ""}
        readOnly
        tabIndex={-1}
        placeholder={placeholder}
        className={className}
      />
    );
  }

  const displayValue = focused
    ? draft
    : value > 0
      ? formatPrice(value)
      : "";

  return (
    <input
      type={focused ? "number" : "text"}
      inputMode="decimal"
      min={focused ? min : undefined}
      step={focused ? step : undefined}
      value={displayValue}
      placeholder={placeholder}
      onFocus={() => {
        setFocused(true);
        setDraft(toEditValue(value));
      }}
      onBlur={() => {
        const next = parseMoneyInput(draft);
        onChange(next);
        setFocused(false);
        setDraft("");
      }}
      onChange={(event) => {
        const nextDraft = event.target.value;
        setDraft(nextDraft);
        onChange(parseMoneyInput(nextDraft));
      }}
      className={className}
    />
  );
}
