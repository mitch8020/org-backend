import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @Length(1, 100)
  preferredName: string;

  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsIn(['public', 'private', 'anonymous'])
  membershipType: 'public' | 'private' | 'anonymous';

  @IsIn(['email', 'signal', 'telegram'])
  contactMethod: 'email' | 'signal' | 'telegram';

  @IsString()
  @Length(1, 150)
  contactHandle: string;

  @IsString()
  @MaxLength(2000)
  beliefsSummary: string;
}

export class ShippingAddressDto {
  @IsString()
  @Length(1, 100)
  recipientName: string;

  @IsString()
  @Length(1, 150)
  line1: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  line2?: string;

  @IsString()
  @Length(1, 100)
  city: string;

  @IsString()
  @Matches(/^[A-Za-z]{2}$/, {
    message: 'state must be a two-letter U.S. abbreviation',
  })
  state: string;

  @IsString()
  @Matches(/^\d{5}(?:-\d{4})?$/, {
    message: 'postalCode must be a valid U.S. ZIP code',
  })
  postalCode: string;

  @IsIn(['US'])
  country: 'US';

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}
