import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * The shadcn/ui class helper: clsx for conditional classes, tailwind-merge to
 * resolve conflicting Tailwind utilities so a later class wins predictably.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
