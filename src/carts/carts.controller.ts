import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Auth0Guard, OptionalAuth0Guard } from '../auth/auth.guard';
import { getUserSub } from '../auth/auth.helpers';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { MergeCartDto, SetCartItemDto } from './carts.dto';
import { CartsService } from './carts.service';

@Controller()
export class CartsController {
  constructor(private readonly carts: CartsService) {}

  @Post('carts/guest')
  createGuestCart() {
    return this.carts.createGuestCart();
  }

  @Get('cart')
  @UseGuards(OptionalAuth0Guard)
  getCart(@Req() request: AuthenticatedRequest) {
    return this.carts.getCurrent(request);
  }

  @Patch('cart/items')
  @UseGuards(OptionalAuth0Guard)
  setItem(@Req() request: AuthenticatedRequest, @Body() body: SetCartItemDto) {
    return this.carts.setItem(request, body);
  }

  @Delete('cart/items/:itemId')
  @UseGuards(OptionalAuth0Guard)
  deleteItem(
    @Req() request: AuthenticatedRequest,
    @Param('itemId') itemId: string,
  ) {
    return this.carts.deleteItem(request, itemId);
  }

  @Post('cart/merge')
  @UseGuards(Auth0Guard)
  merge(@Req() request: AuthenticatedRequest, @Body() body: MergeCartDto) {
    return this.carts.merge(getUserSub(request), body.guestToken);
  }
}
