import { UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedRequest } from './auth.types';

export function getUserSub(request: AuthenticatedRequest): string {
  const sub = request.auth?.payload.sub;
  if (!sub) {
    throw new UnauthorizedException('A valid member identity is required.');
  }
  return sub;
}
