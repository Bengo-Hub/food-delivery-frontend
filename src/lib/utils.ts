import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolves a media URL from the backend.
 * If the URL is relative (starts with /media), it prepends the backend base URL.
 */
export function getMediaUrl(url: string | undefined): string {
  if (!url) return "/images/logo/logo.jpg"; // Default fallback
  
  if (url.startsWith("/media")) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1/";
    // Extract base origin (e.g. http://localhost:4000) from API URL
    try {
      const urlObj = new URL(baseUrl);
      return `${urlObj.origin}${url}`;
    } catch (e) {
      return url;
    }
  }
  
  return url;
}
