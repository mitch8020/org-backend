/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { auth } from 'express-oauth2-jwt-bearer';
import { Auth0Guard, OptionalAuth0Guard } from './auth.guard';

jest.mock('express-oauth2-jwt-bearer', () => ({
  auth: jest.fn(),
}));

const authMock = jest.mocked(auth);

function context(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({ statusCode: 200 }),
    }),
  } as unknown as ExecutionContext;
}

describe('Auth0Guard', () => {
  const config = {
    getOrThrow: jest.fn((key: string) =>
      key === 'AUTH0_AUDIENCE'
        ? 'https://api.example.test'
        : 'https://tenant.example.test/',
    ),
  };

  beforeEach(() => {
    authMock.mockReset();
    config.getOrThrow.mockClear();
  });

  it('configures and accepts a valid token with a subject', async () => {
    const middleware = jest.fn((request, _response, next) => {
      request.auth = { payload: { sub: 'auth0|member' } };
      next();
    });
    authMock.mockReturnValue(middleware as never);
    const guard = new Auth0Guard(config as never);
    const request = { headers: { authorization: 'Bearer token' } };

    await expect(guard.canActivate(context(request))).resolves.toBe(true);
    expect(authMock).toHaveBeenCalledWith({
      audience: 'https://api.example.test',
      issuerBaseURL: 'https://tenant.example.test/',
      tokenSigningAlg: 'RS256',
    });
  });

  it('converts middleware failures to an unauthorized response', async () => {
    authMock.mockReturnValue(
      jest.fn((_request, _response, next) =>
        next(new Error('invalid')),
      ) as never,
    );
    const guard = new Auth0Guard(config as never);

    await expect(
      guard.canActivate(context({ headers: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a validated token without a subject', async () => {
    authMock.mockReturnValue(
      jest.fn((request, _response, next) => {
        request.auth = { payload: {} };
        next();
      }) as never,
    );
    const guard = new Auth0Guard(config as never);

    await expect(guard.canActivate(context({ headers: {} }))).rejects.toThrow(
      'The access token has no subject.',
    );
  });
});

describe('OptionalAuth0Guard', () => {
  it('allows requests without authorization and delegates requests with it', async () => {
    const auth0 = { canActivate: jest.fn().mockResolvedValue(true) };
    const guard = new OptionalAuth0Guard(auth0 as never);
    const anonymous = context({ headers: {} });
    const authorized = context({
      headers: { authorization: 'Bearer token' },
    });

    expect(guard.canActivate(anonymous)).toBe(true);
    await expect(guard.canActivate(authorized)).resolves.toBe(true);
    expect(auth0.canActivate).toHaveBeenCalledWith(authorized);
  });
});
