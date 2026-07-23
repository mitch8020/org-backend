import { CartSchema } from './cart.schema';

describe('CartSchema indexes', () => {
  const indexes = CartSchema.indexes() as unknown as Array<
    [Record<string, number>, Record<string, unknown>]
  >;

  function singleFieldIndexes(field: string) {
    return indexes.filter(
      ([definition]) =>
        Object.keys(definition).length === 1 && definition[field] === 1,
    );
  }

  it('defines each owner lookup index exactly once', () => {
    const ownerIndexes = singleFieldIndexes('ownerSub');
    const guestIndexes = singleFieldIndexes('guestTokenHash');

    expect(ownerIndexes).toHaveLength(1);
    expect(guestIndexes).toHaveLength(1);
    expect(ownerIndexes[0][1]).toMatchObject({
      unique: true,
      partialFilterExpression: { ownerSub: { $type: 'string' } },
    });
    expect(guestIndexes[0][1]).toMatchObject({
      unique: true,
      partialFilterExpression: { guestTokenHash: { $type: 'string' } },
    });
  });

  it('retains the abandoned guest cart TTL index', () => {
    const ttlIndexes = singleFieldIndexes('expiresAt');

    expect(ttlIndexes).toHaveLength(1);
    expect(ttlIndexes[0][1]).toMatchObject({ expireAfterSeconds: 0 });
  });
});
