import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely validates and sanitizes a callback URL to prevent open redirect vulnerabilities.
 * Only allows relative URLs or URLs from the same origin.
 *
 * @param callbackUrl - The URL to validate
 * @param baseUrl - The base URL for the application (defaults to current origin)
 * @returns The sanitized URL or null if invalid
 */
export function validateCallbackUrl(
  callbackUrl: string | null | undefined,
  baseUrl?: string,
): string | null {
  if (!callbackUrl) {
    return null;
  }

  try {
    // Decode the URL if it was encoded
    const decodedUrl = decodeURIComponent(callbackUrl);

    // If it's a relative URL, it's safe
    if (decodedUrl.startsWith("/")) {
      return decodedUrl;
    }

    // If it's an absolute URL, check if it's from the same origin
    const url = new URL(decodedUrl);
    const currentOrigin =
      baseUrl || (typeof window !== "undefined" ? window.location.origin : "");

    if (url.origin === currentOrigin) {
      return decodedUrl;
    }

    // If origins don't match, it's not safe
    return null;
  } catch {
    // If URL parsing fails, it's not safe
    return null;
  }
}
