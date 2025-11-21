import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the base URL for the application
 * Hardcoded to production URL for QR code generation
 * This ensures QR codes work across different networks/devices
 */
export function getBaseUrl(): string {
  return 'https://chaintrack-eight.vercel.app/';
}