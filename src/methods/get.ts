import { ZodSchema } from "zod";
import type { SafeParseReturnType } from "zod";
import { ContentType } from "../types/enums";
import { buildUrl } from "../utils/toolkit";
import { HttpError, ValidationError } from "../utils/classes";

/**
 * Configuration options for the GET request.
 */
export interface GetConfig<R> {
  url?: string;
  baseUrl?: string;
  route?: string;
  queryParams?: Record<string, string | number | boolean>;
  contentType?: ContentType;
  schema?: ZodSchema<R>;
  safeParse?: boolean;
  additionalHeaders?: HeadersInit;
  parseResponse?: (data: unknown) => R;
}

/**
 * Sends a GET request with improved type safety and error handling.
 *
 * @template R - Type of the expected response data after validation or parsing.
 *
 * @param {GetConfig<R>} config - Configuration options for the GET request.
 * @returns {Promise<R>} - Returns the parsed response data.
 *
 * @throws {HttpError} - Throws when the response is not OK.
 * @throws {ValidationError} - Throws when schema validation fails.
 * @throws {Error} - Throws for other errors (e.g., network issues, parsing failures).
 */
export async function GET<R>({
  url,
  baseUrl,
  route,
  queryParams,
  contentType = ContentType.JSON,
  schema,
  safeParse = false,
  additionalHeaders = {},
  parseResponse,
}: GetConfig<R>): Promise<R> {
  const fullUrl = buildUrl(baseUrl, route, url);

  // Append query parameters to the URL if provided
  const urlWithParams = queryParams
    ? appendQueryParams(fullUrl, queryParams)
    : fullUrl;

  const headers: HeadersInit = {
    Accept: contentType, // Use Accept header for GET requests
    ...additionalHeaders,
  };

  try {
    const response = await fetch(urlWithParams, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new HttpError(
        response.status,
        `Network response was not ok, status: ${response.status}`,
      );
    }

    const responseData: unknown =
      contentType === ContentType.JSON
        ? await response.json()
        : await response.text();

    // Validate response data if schema is provided
    let parsedData: R;
    if (schema) {
      if (safeParse) {
        const result: SafeParseReturnType<R, R> =
          schema.safeParse(responseData);
        if (!result.success) {
          throw new ValidationError(result.error);
        }
        parsedData = result.data; // result.data is the validated data
      } else {
        parsedData = schema.parse(responseData); // Will throw if validation fails
      }
    } else {
      parsedData = responseData as R; // Cast if no schema is provided
    }

    // Apply custom parse function if provided
    return parseResponse ? parseResponse(parsedData) : parsedData;
  } catch (error) {
    if (error instanceof HttpError || error instanceof ValidationError) {
      throw error;
    }
    // Provide a default error message for unknown errors
    throw new Error(
      `Request failed: ${
        error instanceof Error ? error.message : "An unknown error occurred"
      }`,
    );
  }
}

/**
 * Appends query parameters to a given URL.
 * @param {string} url - The base URL.
 * @param {Record<string, string | number | boolean>} params - The query parameters.
 * @returns {string} - The URL with appended query parameters.
 */
function appendQueryParams(
  url: string,
  params: Record<string, string | number | boolean>,
): string {
  const urlObj = new URL(url);
  Object.entries(params).forEach(([key, value]) => {
    urlObj.searchParams.append(key, String(value)); // Convert value to string
  });
  return urlObj.toString();
}
