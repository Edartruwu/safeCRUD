import type { ZodError } from "zod";

/**
 * Error class for HTTP request failures.
 */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HttpError);
    }
  }
}

/**
 * Error class for validation failures.
 */
export class ValidationError extends Error {
  constructor(public zodError: ZodError) {
    super("Validation failed");
    this.name = "ValidationError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}
