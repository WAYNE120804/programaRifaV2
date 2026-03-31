export class AppError extends Error {
  statusCode: number;
  errorCode?: string;
  details?: unknown;

  constructor(
    message: string,
    statusCode = 400,
    options?: {
      errorCode?: string;
      details?: unknown;
    }
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = options?.errorCode;
    this.details = options?.details;
  }
}
