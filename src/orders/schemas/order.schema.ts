import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ShippingAddressSchema } from '../../profiles/schemas/member-profile.schema';
import type { ShippingAddress } from '../../profiles/schemas/member-profile.schema';

export type OrderStatus =
  | 'awaiting_donation'
  | 'donation_reported'
  | 'donation_confirmed'
  | 'preparing'
  | 'shipped'
  | 'completed'
  | 'cancelled';

@Schema({ _id: false })
export class OrderItemSnapshot {
  @Prop({ required: true })
  productSlug: string;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  variantId: string;

  @Prop({ required: true })
  variantLabel: string;

  @Prop({ required: true })
  quantity: number;

  @Prop()
  note?: string;

  @Prop({ required: true })
  unitSuggestedDonationCents: number;

  @Prop({ required: true })
  lineSuggestedDonationCents: number;

  @Prop({ required: true })
  imageUrl: string;
}

export const OrderItemSnapshotSchema =
  SchemaFactory.createForClass(OrderItemSnapshot);

@Schema({ _id: false })
export class OrderContactSnapshot {
  @Prop({ required: true })
  preferredName: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  contactMethod: string;

  @Prop({ required: true })
  contactHandle: string;
}

export const OrderContactSnapshotSchema =
  SchemaFactory.createForClass(OrderContactSnapshot);

@Schema({ _id: false })
export class OrderStatusEvent {
  @Prop({ required: true })
  status: OrderStatus;

  @Prop({ required: true })
  at: Date;

  @Prop({ required: true })
  actor: 'member' | 'admin' | 'system';
}

export const OrderStatusEventSchema =
  SchemaFactory.createForClass(OrderStatusEvent);

@Schema({ _id: false })
export class DonationReport {
  @Prop({ required: true })
  method: 'paypal' | 'venmo';

  @Prop()
  amountCents?: number;

  @Prop({ required: true })
  reportedAt: Date;
}

export const DonationReportSchema =
  SchemaFactory.createForClass(DonationReport);

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true, index: true })
  orderNumber: string;

  @Prop({ required: true, index: true })
  ownerSub: string;

  @Prop({ required: true })
  idempotencyKey: string;

  @Prop({ required: true })
  donationMemo: string;

  @Prop({ type: [OrderItemSnapshotSchema], required: true })
  items: OrderItemSnapshot[];

  @Prop({ type: OrderContactSnapshotSchema, required: true })
  contact: OrderContactSnapshot;

  @Prop({ type: ShippingAddressSchema, required: true })
  shippingAddress: ShippingAddress;

  @Prop({ required: true })
  suggestedItemsCents: number;

  @Prop({ required: true })
  suggestedShippingCents: number;

  @Prop({ required: true })
  suggestedTotalCents: number;

  @Prop()
  declaredDonationCents?: number;

  @Prop({ default: 'awaiting_donation', index: true })
  status: OrderStatus;

  @Prop({ type: [OrderStatusEventSchema], default: [] })
  statusHistory: OrderStatusEvent[];

  @Prop({ type: DonationReportSchema })
  donationReport?: DonationReport;

  @Prop()
  trackingNumber?: string;

  @Prop({ default: 'pending' })
  emailState: 'pending' | 'sent' | 'failed' | 'skipped';

  @Prop()
  emailError?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export type OrderDocument = HydratedDocument<Order>;
export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ ownerSub: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ ownerSub: 1, idempotencyKey: 1 }, { unique: true });
