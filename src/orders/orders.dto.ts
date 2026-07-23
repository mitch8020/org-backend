import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { OrderStatus } from './schemas/order.schema';

export class CreateOrderDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  declaredDonationCents?: number;
}

export class ReportDonationDto {
  @IsIn(['paypal', 'venmo'])
  method: 'paypal' | 'venmo';

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  amountCents?: number;
}

export class UpdateOrderStatusDto {
  @IsIn([
    'awaiting_donation',
    'donation_reported',
    'donation_confirmed',
    'preparing',
    'shipped',
    'completed',
    'cancelled',
  ])
  status: OrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  trackingNumber?: string;
}
