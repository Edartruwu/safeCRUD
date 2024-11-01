/**
 * Validates and constructs the full URL for the request.
 * Throws an error if URL components are missing or invalid.
 */
export function buildUrl(
  baseUrl?: string,
  route?: string,
  url?: string,
): string {
  try {
    if (url) {
      return new URL(url).toString();
    }
    if (baseUrl && route) {
      return new URL(route, baseUrl).toString();
    }
    throw new Error(
      "Either 'url' or both 'baseUrl' and 'route' must be provided and valid",
    );
  } catch (error) {
    throw new Error(
      `Invalid URL: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
