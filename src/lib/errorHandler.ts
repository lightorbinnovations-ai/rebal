/**
 * Centralized Error Handler
 * Provides consistent error processing across the application
 */

import { toast } from "sonner";

export interface AppError {
  code?: string;
  message: string;
  details?: string;
  originalError?: unknown;
}

/**
 * Standard error codes for the application
 */
export const ERROR_CODES = {
  NETWORK_ERROR: "NETWORK_ERROR",
  AUTH_ERROR: "AUTH_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMIT: "RATE_LIMIT",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  SERVER_ERROR: "SERVER_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

/**
 * User-friendly error messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.NETWORK_ERROR]: "Connection error. Please check your internet and try again.",
  [ERROR_CODES.AUTH_ERROR]: "Authentication failed. Please sign in again.",
  [ERROR_CODES.VALIDATION_ERROR]: "Please check your input and try again.",
  [ERROR_CODES.NOT_FOUND]: "The requested resource was not found.",
  [ERROR_CODES.RATE_LIMIT]: "Too many requests. Please wait a moment and try again.",
  [ERROR_CODES.PERMISSION_DENIED]: "You don't have permission to perform this action.",
  [ERROR_CODES.SERVER_ERROR]: "Something went wrong on our end. Please try again later.",
  [ERROR_CODES.UNKNOWN_ERROR]: "An unexpected error occurred. Please try again.",
};

/**
 * Parse an error into a standardized AppError format
 */
export function parseError(error: unknown): AppError {
  // Handle null/undefined
  if (!error) {
    return {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR],
      originalError: error,
    };
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Check for specific error patterns
    const message = error.message.toLowerCase();

    // Network errors
    if (message.includes("fetch") || message.includes("network") || message.includes("failed to fetch")) {
      return {
        code: ERROR_CODES.NETWORK_ERROR,
        message: ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR],
        details: error.message,
        originalError: error,
      };
    }

    // Rate limit errors
    if (message.includes("too many requests") || message.includes("rate limit")) {
      return {
        code: ERROR_CODES.RATE_LIMIT,
        message: ERROR_MESSAGES[ERROR_CODES.RATE_LIMIT],
        details: error.message,
        originalError: error,
      };
    }

    // Auth errors
    if (message.includes("auth") || message.includes("unauthorized") || message.includes("not authenticated")) {
      return {
        code: ERROR_CODES.AUTH_ERROR,
        message: ERROR_MESSAGES[ERROR_CODES.AUTH_ERROR],
        details: error.message,
        originalError: error,
      };
    }

    // Permission errors
    if (message.includes("permission") || message.includes("forbidden") || message.includes("row-level security")) {
      return {
        code: ERROR_CODES.PERMISSION_DENIED,
        message: ERROR_MESSAGES[ERROR_CODES.PERMISSION_DENIED],
        details: error.message,
        originalError: error,
      };
    }

    // Not found
    if (message.includes("not found") || message.includes("does not exist")) {
      return {
        code: ERROR_CODES.NOT_FOUND,
        message: ERROR_MESSAGES[ERROR_CODES.NOT_FOUND],
        details: error.message,
        originalError: error,
      };
    }

    // Default: return the original message
    return {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: error.message || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR],
      originalError: error,
    };
  }

  // Handle Supabase-style errors (objects with message property)
  if (typeof error === "object" && "message" in error) {
    const errorObj = error as { message: string; code?: string };
    return parseError(new Error(errorObj.message));
  }

  // Handle string errors
  if (typeof error === "string") {
    return parseError(new Error(error));
  }

  // Unknown error type
  return {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR],
    details: String(error),
    originalError: error,
  };
}

/**
 * Log an error (in production, this would send to monitoring service)
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  const parsed = parseError(error);
  
  // Always log to console in development
  console.error("[Error]", {
    code: parsed.code,
    message: parsed.message,
    details: parsed.details,
    context,
    originalError: parsed.originalError,
  });

  // TODO: In production, send to monitoring service
  // Example: Sentry.captureException(parsed.originalError, { extra: { ...parsed, ...context } });
}

/**
 * Handle an error with optional toast notification
 */
export function handleError(
  error: unknown,
  options: {
    showToast?: boolean;
    toastTitle?: string;
    context?: Record<string, unknown>;
    silent?: boolean;
  } = {}
): AppError {
  const { showToast = true, toastTitle, context, silent = false } = options;
  
  const parsed = parseError(error);

  // Log the error (unless silent)
  if (!silent) {
    logError(error, context);
  }

  // Show toast notification
  if (showToast && !silent) {
    toast.error(toastTitle || "Error", {
      description: parsed.message,
    });
  }

  return parsed;
}

/**
 * Create a safe async wrapper that handles errors
 */
export function createSafeAsync<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  options: {
    showToast?: boolean;
    toastTitle?: string;
    fallback?: R;
    context?: Record<string, unknown>;
  } = {}
): (...args: T) => Promise<R | undefined> {
  return async (...args: T) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, options);
      return options.fallback;
    }
  };
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = () => true,
  } = options;

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if we shouldn't or if this was the last attempt
      if (!shouldRetry(error) || attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
      
      // Exponential backoff with max cap
      delay = Math.min(delay * 2, maxDelay);
    }
  }

  throw lastError;
}

export default handleError;
