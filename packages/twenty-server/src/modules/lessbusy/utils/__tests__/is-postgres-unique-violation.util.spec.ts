import { QueryFailedError } from 'typeorm';

import { isPostgresUniqueViolation } from '../is-postgres-unique-violation.util';

describe('isPostgresUniqueViolation', () => {
  const buildDriverError = (code?: string) =>
    Object.assign(new Error('violated'), { code });

  it('accepts a pg 23505 code attached directly to the error', () => {
    expect(
      isPostgresUniqueViolation(Object.assign(new Error('failed'), { code: '23505' })),
    ).toBe(true);
  });

  it('accepts a TypeORM QueryFailedError carrying the code in driverError', () => {
    const failure = new QueryFailedError(
      'duplicate key value violates unique constraint',
      [],
      buildDriverError('23505'),
    );

    expect(isPostgresUniqueViolation(failure)).toBe(true);
  });

  it('rejects other postgres error codes', () => {
    expect(isPostgresUniqueViolation(buildDriverError('40001'))).toBe(false);
    expect(isPostgresUniqueViolation(buildDriverError('23000'))).toBe(false);
  });

  it('rejects errors without a postgres code', () => {
    expect(isPostgresUniqueViolation(new Error('boom'))).toBe(false);
    expect(isPostgresUniqueViolation('duplicate key')).toBe(false);
    expect(isPostgresUniqueViolation(null)).toBe(false);
    expect(isPostgresUniqueViolation(undefined)).toBe(false);
  });
});
