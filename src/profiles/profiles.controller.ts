import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Auth0Guard } from '../auth/auth.guard';
import { getUserSub } from '../auth/auth.helpers';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { ProfilesService } from './profiles.service';
import { ShippingAddressDto, UpdateProfileDto } from './profiles.dto';

@Controller('me')
@UseGuards(Auth0Guard)
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get()
  getMe(@Req() request: AuthenticatedRequest) {
    return this.profiles.getOrCreate(getUserSub(request));
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
