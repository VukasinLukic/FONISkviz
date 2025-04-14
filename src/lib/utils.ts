import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge class names with Tailwind CSS classes
 * Uses clsx for conditional class names and twMerge to handle Tailwind conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Function to get the mascot image URL based on its ID
export function getMascotImageUrl(mascotId: number | undefined | null): string {
  if (mascotId === null || mascotId === undefined || mascotId < 1 || mascotId > 18) {
    // Return a default/placeholder image or an empty string if the ID is invalid
    return '/assets/default-mascot.svg'; // Adjust the default path as needed
  }
  return `/assets/maskota${mascotId}.svg`;
}