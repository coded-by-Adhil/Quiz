export type FieldErrors = Record<string, string[]>;

export interface ApiError {
  status: number | null;
  message: string;
  fieldErrors?: FieldErrors;
}
