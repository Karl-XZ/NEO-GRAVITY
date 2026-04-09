import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Split a pipe-separated string into an array, filtering out empty/none values */
export function splitPipe(value: string | null | undefined): string[] {
  if (!value || value === "none" || value === "None") return [];
  return value.split("|").filter(Boolean);
}
