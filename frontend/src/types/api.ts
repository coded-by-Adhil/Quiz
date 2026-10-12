export type FieldErrors = Record<string, string[]>;

export interface ApiError {
  status: number | null;
  message: string;
  fieldErrors?: FieldErrors;
}

export interface Paginated<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  links: Array<{
    active: boolean;
    label: string;
    url: string | null;
    page: number | null;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}
