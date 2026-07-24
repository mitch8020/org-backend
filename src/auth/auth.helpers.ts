import { UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedRequest } from './auth.types';

export function getUserSub(request: AuthenticatedRequest): string {
  const sub = request.auth?.payload.sub;
  if (!sub) {
    throw new UnauthorizedException('A valid member identity is required.');
  }
  return sub;
}

export function getPermissions(request: AuthenticatedRequest): string[] {
  const permissions = request.auth?.payload.permissions;
  if (!Array.isArray(permissions)) return [];
  return permissions.filter(
    (permission): permission is string => typeof permission === 'string',
  );
}

export function hasPermissions(
  request: AuthenticatedRequest,
  ...required: string[]
): boolean {
  const permissions = getPermissions(request);
  return required.every((permission) => permissions.includes(permission));
}

export function getCapabilities(
  request: AuthenticatedRequest,
  hasAdminAccess = false,
) {
  return {
    canManageOrders:
      hasAdminAccess || hasPermissions(request, 'read:orders', 'update:orders'),
    canEditWebsite:
      hasAdminAccess ||
      hasPermissions(request, 'read:content', 'update:content'),
    canPublishWebsite:
      hasAdminAccess || hasPermissions(request, 'publish:content'),
  };
}
