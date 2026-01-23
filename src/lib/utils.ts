import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimestamp(timestamp: string | undefined): string {
  if (!timestamp) return 'No timestamp';
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleString();
}
