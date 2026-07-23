import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';

function context(permissions: string[]): ExecutionContext {
  return {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({
      getRequest: () => ({
        auth: { payload: { sub: 'auth0|member', permissions } },
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };
  const guard = new PermissionsGuard(reflector as never);

  beforeEach(() => reflector.getAllAndOverride.mockReset());

  it('allows a token with every route permission', () => {
    reflector.getAllAndOverride.mockReturnValue([
      'read:content',
      'update:content',
    ]);

    expect(guard.canActivate(context(['read:content', 'update:content']))).toBe(
      true,
    );
  });

  it('rejects a token that is missing a route permission', () => {
    reflector.getAllAndOverride.mockReturnValue(['publish:content']);

    expect(() => guard.canActivate(context(['read:content']))).toThrow(
      ForbiddenException,
    );
  });
});
