/** Error with an HTTP status and a message that is safe to show to users. */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'AppError';
  }
}

/** The model returned something we could not parse or validate. */
export class InvalidModelOutputError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'InvalidModelOutputError';
  }
}

/** The model declined to answer (e.g. OpenAI structured-output refusal). */
export class ModelRefusalError extends Error {
  constructor(message = 'The model declined to answer.') {
    super(message);
    this.name = 'ModelRefusalError';
  }
}
