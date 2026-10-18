import { POSTGRESQL_ERROR_CODES } from 'src/engine/api/graphql/workspace-query-runner/constants/postgres-error-codes.constants';

// Postgres aborts the whole transaction on 23505, so callers cannot re-read the
// winning row in the same transaction; the convergent retry must happen after
// the rollback. This util keeps that conversion explicit at every idempotency-key
// insert instead of letting a raw QueryFailedError surface as a 500.
type ErrorWithCode = {
  code?: unknown;
  driverError?: { code?: unknown } | null;
};

export const isPostgresUniqueViolation = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;

  const candidate = error as Error & Partial<ErrorWithCode>;
  const code =
    typeof candidate.code === 'string'
      ? candidate.code
      : typeof candidate.driverError?.code === 'string'
        ? candidate.driverError?.code
        : undefined;

  return code === POSTGRESQL_ERROR_CODES.UNIQUE_VIOLATION;
};
