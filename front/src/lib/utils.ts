import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const text = String(value).trim();
  const dateOnly = text.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  const date = dateOnly
    ? new Date(`${dateOnly}T12:00:00`)
    : new Date(text);

  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('pt-BR');
}
