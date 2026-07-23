import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MembershipType = 'public' | 'private' | 'anonymous';
export type ContactMethod = 'email' | 'signal' | 'telegram';

@Schema({ _id: false })
export class ShippingAddress {
  @Prop({ required: true })
  recipientName: string;

  @Prop({ required: true })
  line1: string;

  @Prop()
  line2?: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  state: string;

  @Prop({ required: true })
  postalCode: string;

  @Prop({ default: 'US' })
  country: 'US';

  @Prop()
  phone?: string;
}

export const ShippingAddressSchema =
  SchemaFactory.createForClass(ShippingAddress);

@Schema({ timestamps: true })
export class MemberProfile {
  @Prop({ required: true, unique: true, index: true })
  auth0Sub: string;

  @Prop({ default: '' })
  preferredName: string;

  @Prop({ default: '' })
  email: string;

  @Prop({ default: 'private' })
  membershipType: MembershipType;

  @Prop({ default: 'email' })
  contactMethod: ContactMethod;

  @Prop({ default: '' })
  contactHandle: string;

  @Prop({ default: '' })
  beliefsSummary: string;

  @Prop({ type: ShippingAddressSchema })
  shippingAddress?: ShippingAddress;

  createdAt?: Date;
  updatedAt?: Date;
}

export type MemberProfileDocument = HydratedDocument<MemberProfile>;
export const MemberProfileSchema = SchemaFactory.createForClass(MemberProfile);
