import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Auth0UserInfoService } from './auth0-user-info.service';

describe('Auth0UserInfoService', () => {
  const config = {
    getOrThrow: jest.fn(() => 'https://tenant.example.test/'),
  };
  const request = {
    headers: { authorization: 'Bearer access-token' },
  };

  afterEach(() => {
    jest.restoreAllMocks();
    config.getOrThrow.mockClear();
  });

  it('loads and normalizes the verified Auth0 identity email', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          sub: 'auth0|member',
          email: ' ADMIN@EXAMPLE.TEST ',
          email_verified: true,
        }),
        { status: 200 },
      ),
    );
    const service = new Auth0UserInfoService(config as never);

    await expect(
      service.getIdentity(request as never, 'auth0|member'),
    ).resolves.toEqual({
      email: 'admin@example.test',
      emailVerified: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://tenant.example.test/userinfo');
    expect(options?.headers).toEqual({
      Authorization: 'Bearer access-token',
    });
    expect(options?.signal).toBeInstanceOf(AbortSignal);
  });

  it.each([
    ['missing', { sub: 'auth0|member' }],
    ['empty', { sub: 'auth0|member', email: '  ' }],
    ['malformed', { sub: 'auth0|member', email: 42 }],
  ])('does not invent an identity email when it is %s', async (_name, body) => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
    const service = new Auth0UserInfoService(config as never);

    await expect(
      service.getIdentity(request as never, 'auth0|member'),
    ).resolves.toBeUndefined();
  });

  it('records an Auth0 email as unverified unless Auth0 says otherwise', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          sub: 'auth0|member',
          email: 'member@example.test',
          email_verified: false,
        }),
        { status: 200 },
      ),
    );
    const service = new Auth0UserInfoService(config as never);

    await expect(
      service.getIdentity(request as never, 'auth0|member'),
    ).resolves.toEqual({
      email: 'member@example.test',
      emailVerified: false,
    });
  });

  it('requires an authorization header', async () => {
    const service = new Auth0UserInfoService(config as never);

    await expect(
      service.getIdentity({ headers: {} } as never, 'auth0|member'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it.each([401, 403])(
    'rejects an Auth0 user-info response with status %s',
    async (status) => {
      jest
        .spyOn(global, 'fetch')
        .mockResolvedValue(new Response(null, { status }));
      const service = new Auth0UserInfoService(config as never);

      await expect(
        service.getIdentity(request as never, 'auth0|member'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    },
  );

  it('rejects a user-info subject that does not match the access token', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ sub: 'auth0|someone-else' }), {
        status: 200,
      }),
    );
    const service = new Auth0UserInfoService(config as never);

    await expect(
      service.getIdentity(request as never, 'auth0|member'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it.each([
    ['a failed request', () => Promise.reject(new Error('network failure'))],
    [
      'an unavailable response',
      () => Promise.resolve(new Response(null, { status: 503 })),
    ],
    [
      'invalid JSON',
      () =>
        Promise.resolve(
          new Response('not-json', {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
    ],
  ])('reports %s as temporarily unavailable', async (_name, response) => {
    jest.spyOn(global, 'fetch').mockImplementation(response);
    const service = new Auth0UserInfoService(config as never);

    await expect(
      service.getIdentity(request as never, 'auth0|member'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
