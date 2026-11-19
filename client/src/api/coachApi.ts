import type { ApiTurn, CoachResponse } from '../types';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// A little above the server's LLM timeout so the server's error message wins.
const REQUEST_TIMEOUT_MS = 60_000;

export async function sendToCoach(messages: ApiTurn[], signal: AbortSignal): Promise<CoachResponse> {
  let response: Response;
  try {
    response = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal: AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]),
    });
  } catch (error) {
    if (signal.aborted) throw error;
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new ApiError('The coach took too long to reply. Try again.', 0, 'timeout');
    }
    throw new ApiError("Couldn't reach the coach. Check your connection and try again.", 0, 'network');
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (body as { error?: { message?: string; code?: string } } | null)?.error;
    throw new ApiError(
      error?.message ?? `The coach couldn't reply (error ${response.status}). Try again.`,
      response.status,
      error?.code ?? 'unknown',
    );
  }
  return body as CoachResponse;
}
