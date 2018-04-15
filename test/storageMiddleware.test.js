import { uuid } from 'storageMiddleware';

describe('uuid', () => {
  it('returns unique ids', () => {
    expect(uuid()).not.toBe(uuid());
    expect(uuid()).not.toBe(uuid());
    expect(uuid()).not.toBe(uuid());
  });
});
