import {
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class SetCartItemDto {
  @IsString()
  @Length(1, 100)
  productSlug: string;

  @IsString()
  @Length(1, 100)
  variantId: string;

  @IsInt()
  @Min(1)
  @Max(10)
  quantity: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class MergeCartDto {
  @IsString()
  @Length(40, 200)
  guestToken: string;
}
