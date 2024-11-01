import { ZodSchema } from "zod";
import type { SafeParseReturnType } from "zod";
import { ContentType } from "../types/enums";
import { buildUrl } from "../utils/toolkit";
import { HttpError, ValidationError } from "../utils/classes";

/**
 * Configuration options for the POST request.
 */
export interface PostConfig<T, R> {
  url?: string;
  baseUrl?: string;
  route?: string;
  body?: T;
  contentType?: ContentType;
  schema?: ZodSchema<R>;
  safeParse?: boolean;
  additionalHeaders?: HeadersInit;
  parseResponse?: (data: unknown) => R;
}

/**
 * Sends a POST request with improved type safety and error handling.
 *
 * @template T - Type of the request body.
 * @template R - Type of the expected response data after validation or parsing.
 *
 * @param {PostConfig<T, R>} config - Configuration options for the POST request.
 * @returns {Promise<R>} - Returns the parsed response data.
 *
 * @throws {HttpError} - Throws when the response is not OK.
 * @throws {ValidationError} - Throws when schema validation fails.
 * @throws {Error} - Throws for other errors (e.g., network issues, parsing failures).
 */
export async function POST<T, R>({
  url,
  baseUrl,
  route,
  body,
  contentType = ContentType.JSON,
  schema,
  safeParse = false,
  additionalHeaders = {},
  parseResponse,
}: PostConfig<T, R>): Promise<R> {
  const fullUrl = buildUrl(baseUrl, route, url);

  if (body === undefined) {
    throw new Error("Body must be provided");
  }

  const headers: HeadersInit = {
    "Content-Type": contentType,
    ...additionalHeaders,
  };

  const requestBody: BodyInit = (() => {
    switch (contentType) {
      case ContentType.JSON:
        return JSON.stringify(body);
      case ContentType.FORM_URLENCODED:
        return new URLSearchParams(body as Record<string, string>).toString();
      case ContentType.TEXT:
      case ContentType.XML:
      case ContentType.HTML:
        return body as string;
      default:
        throw new Error(`Unsupported Content-Type: ${contentType}`);
    }
  })();

  try {
    const response = await fetch(fullUrl, {
      method: "POST",
      headers,
      body: requestBody,
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
