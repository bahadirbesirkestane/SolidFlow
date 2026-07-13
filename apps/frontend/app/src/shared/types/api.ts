export type ApiSuccess<T> = {
  data: T;
  meta?: Record<string, unknown>;
  error?: null;
};

export type ApiErrorShape = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiErrorResponse = {
  data?: null;
  meta?: Record<string, unknown>;
  error: ApiErrorShape;
};
