import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MemberProfile,
  MemberProfileSchema,
} from '../profiles/schemas/member-profile.schema';
import { AdminAccessService } from './admin-access.service';
import { Auth0UserInfoService } from './auth0-user-info.service';
import { Auth0Guard, OptionalAuth0Guard } from './auth.guard';
import { PermissionsGuard } from './permissions.guard';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: MemberProfile.name,
        schema: MemberProfileSchema,
      },
    ]),
  ],
  providers: [
    AdminAccessService,
    Auth0Guard,
    Auth0UserInfoService,
    OptionalAuth0Guard,
    PermissionsGuard,
  ],
  exports: [
    AdminAccessService,
    Auth0Guard,
    Auth0UserInfoService,
    OptionalAuth0Guard,
    PermissionsGuard,
  ],
})
export class AuthModule {}
