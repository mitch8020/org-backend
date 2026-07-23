import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from './auth.types';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const rawPermissions = request.auth?.payload.permissions;
    const permissions = Array.isArray(rawPermissions)
      ? rawPermissions.filter(
          (permission): permission is string => typeof permission === 'string',
        )
      : [];
    if (!required.every((permission) => permissions.includes(permission))) {
      throw new ForbiddenException(
        'Your account does not have permission to perform this action.',
      );
    }
    return true;
  }
}
