import { ProfilesService } from './profiles.service';

function query<T>(value: T) {
  const chain = {
    lean: jest.fn(),
    exec: jest.fn().mockResolvedValue(value),
  };
  chain.lean.mockReturnValue(chain);
  return chain;
}

describe('ProfilesService', () => {
  it('creates lean and document member records on demand', async () => {
    const leanQuery = query({ auth0Sub: 'auth0|member' });
    const documentQuery = {
      exec: jest.fn().mockResolvedValue({ auth0Sub: 'auth0|member' }),
    };
    const model = {
      findOneAndUpdate: jest
        .fn()
        .mockReturnValueOnce(leanQuery)
        .mockReturnValueOnce(documentQuery),
    };
    const service = new ProfilesService(model as never);

    await expect(service.getOrCreate('auth0|member')).resolves.toEqual({
      auth0Sub: 'auth0|member',
    });
    await expect(service.getDocument('auth0|member')).resolves.toEqual({
      auth0Sub: 'auth0|member',
    });
    for (const call of model.findOneAndUpdate.mock.calls) {
      expect(call).toEqual([
        { auth0Sub: 'auth0|member' },
        { $setOnInsert: { auth0Sub: 'auth0|member' } },
        {
          returnDocument: 'after',
          upsert: true,
          setDefaultsOnInsert: true,
        },
      ]);
    }
  });

  it('stores the trusted Auth0 email separately from editable contact data', async () => {
    const result = {
      auth0Sub: 'auth0|member',
      authEmail: 'admin@example.test',
    };
    const updateQuery = query(result);
    const model = { findOneAndUpdate: jest.fn(() => updateQuery) };
    const service = new ProfilesService(model as never);

    await expect(
      service.getOrCreate('auth0|member', {
        email: ' ADMIN@EXAMPLE.TEST ',
        emailVerified: true,
      }),
    ).resolves.toBe(result);

    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { auth0Sub: 'auth0|member' },
      {
        $setOnInsert: {
          auth0Sub: 'auth0|member',
          email: 'admin@example.test',
        },
        $set: {
          authEmail: 'admin@example.test',
          authEmailVerified: true,
        },
      },
      {
        returnDocument: 'after',
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );
  });

  it('normalizes editable profile fields', async () => {
    const result = { preferredName: 'Member' };
    const updateQuery = query(result);
    const model = { findOneAndUpdate: jest.fn(() => updateQuery) };
    const service = new ProfilesService(model as never);

    await expect(
      service.update('auth0|member', {
        preferredName: '  Member ',
        email: ' MEMBER@EXAMPLE.TEST ',
        membershipType: 'private',
        contactMethod: 'signal',
        contactHandle: '  member.01 ',
        beliefsSummary: '  Summary ',
      }),
    ).resolves.toBe(result);

    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { auth0Sub: 'auth0|member' },
      {
        $set: {
          preferredName: 'Member',
          email: 'member@example.test',
          membershipType: 'private',
          contactMethod: 'signal',
          contactHandle: 'member.01',
          beliefsSummary: 'Summary',
        },
      },
      {
        returnDocument: 'after',
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );
  });

  it.each([
    ['with optional values', ' Apt 2 ', ' 555-0100 ', 'Apt 2', '555-0100'],
    ['without optional values', ' ', undefined, undefined, undefined],
  ])(
    'normalizes a shipping address %s',
    async (_name, line2, phone, expectedLine2, expectedPhone) => {
      const updateQuery = query({ shippingAddress: {} });
      const model = { findOneAndUpdate: jest.fn(() => updateQuery) };
      const service = new ProfilesService(model as never);

      await service.updateShipping('auth0|member', {
        recipientName: '  Member ',
        line1: ' 1 Main St ',
        line2,
        city: ' Nashville ',
        state: 'tn',
        postalCode: ' 37201 ',
        country: 'US',
        phone,
      });

      expect(model.findOneAndUpdate.mock.calls[0][1]).toEqual({
        $set: {
          shippingAddress: {
            recipientName: 'Member',
            line1: '1 Main St',
            line2: expectedLine2,
            city: 'Nashville',
            state: 'TN',
            postalCode: '37201',
            phone: expectedPhone,
            country: 'US',
          },
        },
      });
    },
  );

  it('removes a shipping address', async () => {
    const updateQuery = query({ shippingAddress: undefined });
    const model = { findOneAndUpdate: jest.fn(() => updateQuery) };
    const service = new ProfilesService(model as never);

    await service.deleteShipping('auth0|member');

    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { auth0Sub: 'auth0|member' },
      { $unset: { shippingAddress: 1 } },
      {
        returnDocument: 'after',
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );
  });
});
