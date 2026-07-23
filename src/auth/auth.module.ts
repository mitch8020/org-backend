import { Global, Module } from '@nestjs/common';
import { Auth0Guard, OptionalAuth0Guard } from './auth.guard';
import { PermissionsGuard } from './permissions.guard';

@Global()
@Module({
  providers: [Auth0Guard, OptionalAuth0Guard, PermissionsGuard],
  exports: [Auth0Guard, OptionalAuth0Guard, PermissionsGuard],
})
export class AuthModule {}
