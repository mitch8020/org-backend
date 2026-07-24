import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Auth0UserInfoService } from '../auth/auth0-user-info.service';
import { Auth0Guard } from '../auth/auth.guard';
import { getCapabilities, getUserSub } from '../auth/auth.helpers';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { ProfilesService } from './profiles.service';
import { ShippingAddressDto, UpdateProfileDto } from './profiles.dto';

@Controller('me')
@UseGuards(Auth0Guard)
export class ProfilesController {
  constructor(
    private readonly profiles: ProfilesService,
    private readonly auth0UserInfo: Auth0UserInfoService,
  ) {}

  @Get()
  async getMe(@Req() request: AuthenticatedRequest) {
    const auth0Sub = getUserSub(request);
    const identity = await this.auth0UserInfo.getIdentity(request, auth0Sub);
    return this.profiles.getOrCreate(auth0Sub, identity);
  }

  @Get('capabilities')
  getCapabilities(@Req() request: AuthenticatedRequest) {
    return getCapabilities(request);
  }

  @Patch()
  updateMe(
    @Req() request: AuthenticatedRequest,
    @Body() body: UpdateProfileDto,
  ) {
    return this.profiles.update(getUserSub(request), body);
  }

  @Get('shipping')
  async getShipping(@Req() request: AuthenticatedRequest) {
    const profile = await this.profiles.getOrCreate(getUserSub(request));
    return profile.shippingAddress ?? null;
  }

  @Patch('shipping')
  updateShipping(
    @Req() request: AuthenticatedRequest,
    @Body() body: ShippingAddressDto,
  ) {
    return this.profiles.updateShipping(getUserSub(request), body);
  }

  @Delete('shipping')
  deleteShipping(@Req() request: AuthenticatedRequest) {
    return this.profiles.deleteShipping(getUserSub(request));
  }
}
