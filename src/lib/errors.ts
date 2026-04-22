import { ApiError, ApiSpaFallbackError } from '@/api/types';

/**
 * Turns an unknown thrown value into a user-displayable message. Centralised
 * so every page can use the same heuristics without duplicating the branching.
 */
export function formatErrorMessage(err: unknown): string {
  if (err instanceof ApiSpaFallbackError) return err.message;
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Unknown error';
}
