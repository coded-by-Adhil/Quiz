import axios from "axios";
import type { ApiError, FieldErrors } from "@/types/api";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readFieldErrors(value: unknown): FieldErrors | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const fieldErrors: FieldErrors = {};

  for (const [field, messages] of Object.entries(value)) {
    if (typeof messages === "string") {
      fieldErrors[field] = [messages];
      continue;
    }

    if (
      Array.isArray(messages) &&
      messages.every((message): message is string => typeof message === "string")
    ) {
      fieldErrors[field] = messages;
    }
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
}

export function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? null;
    const responseData: unknown = error.response?.data;

    if (isRecord(responseData)) {
      const message =
        typeof responseData.message === "string"
          ? responseData.message
          : "The request could not be completed.";
      const fieldErrors = readFieldErrors(responseData.errors);

      return fieldErrors
        ? { status, message, fieldErrors }
        : { status, message };
    }

    return {
      status,
      message: error.request
        ? "The API could not be reached. Check that the backend is running."
        : "The request could not be completed.",
    };
  }

  if (error instanceof Error) {
    return {
      status: null,
      message: error.message,
    };
  }

  return {
    status: null,
    message: "An unexpected error occurred.",
  };
}
