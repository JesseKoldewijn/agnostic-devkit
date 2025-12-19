import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names using clsx and merges Tailwind classes using tailwind-merge.
 * This ensures that conflicting Tailwind classes (e.g., 'p-2 p-4') are resolved correctly.
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
