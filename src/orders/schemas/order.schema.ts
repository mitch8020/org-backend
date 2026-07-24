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
  @Prop({ type: String, required: true })
  productSlug: string;

  @Prop({ type: String, required: true })
  productName: string;

  @Prop({ type: String, required: true })
  variantId: string;

  @Prop({ type: String, required: true })
  variantLabel: string;

  @Prop({ type: Number, required: true })
  quantity: number;

  @Prop({ type: String })
  note?: string;

  @Prop({ type: Number, required: true })
  unitSuggestedDonationCents: number;

  @Prop({ type: Number, required: true })
  lineSuggestedDonationCents: number;

  @Prop({ type: String, required: true })
  imageUrl: string;
}

export const OrderItemSnapshotSchema =
  SchemaFactory.createForClass(OrderItemSnapshot);

@Schema({ _id: false })
export class OrderContactSnapshot {
  @Prop({ type: String, required: true })
  preferredName: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, required: true })
  contactMethod: string;

  @Prop({ type: String, required: true })
  contactHandle: string;
}

export const OrderContactSnapshotSchema =
  SchemaFactory.createForClass(OrderContactSnapshot);

@Schema({ _id: false })
export class OrderStatusEvent {
  @Prop({ type: String, required: true })
  status: OrderStatus;

  @Prop({ type: Date, required: true })
  at: Date;

  @Prop({ type: String, required: true })
  actor: 'member' | 'admin' | 'system';
}

export const OrderStatusEventSchema =
  SchemaFactory.createForClass(OrderStatusEvent);

@Schema({ _id: false })
export class DonationReport {
  @Prop({ type: String, required: true })
  method: 'paypal' | 'venmo';

  @Prop({ type: Number })
  amountCents?: number;

  @Prop({ type: Date, required: true })
  reportedAt: Date;
}

export const DonationReportSchema =
  SchemaFactory.createForClass(DonationReport);

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: String, required: true, unique: true, index: true })
  orderNumber: string;

  @Prop({ type: String, required: true, index: true })
  ownerSub: string;

  @Prop({ type: String, required: true })
  idempotencyKey: string;

  @Prop({ type: String, required: true })
  donationMemo: string;

  @Prop({ type: [OrderItemSnapshotSchema], required: true })
  items: OrderItemSnapshot[];

  @Prop({ type: OrderContactSnapshotSchema, required: true })
  contact: OrderContactSnapshot;

  @Prop({ type: ShippingAddressSchema, required: true })
  shippingAddress: ShippingAddress;

  @Prop({ type: Number, required: true })
  suggestedItemsCents: number;

  @Prop({ type: Number, required: true })
  suggestedShippingCents: number;

  @Prop({ type: Number, required: true })
  suggestedTotalCents: number;

  @Prop({ type: Number })
  declaredDonationCents?: number;

  @Prop({ type: String, default: 'awaiting_donation', index: true })
  status: OrderStatus;

  @Prop({ type: [OrderStatusEventSchema], default: [] })
  statusHistory: OrderStatusEvent[];

  @Prop({ type: DonationReportSchema })
  donationReport?: DonationReport;

  @Prop({ type: String })
  trackingNumber?: string;

  @Prop({ type: String, default: 'pending' })
  emailState: 'pending' | 'sent' | 'failed' | 'skipped';

  @Prop({ type: String })
  emailError?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export type OrderDocument = HydratedDocument<Order>;
export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ ownerSub: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ ownerSub: 1, idempotencyKey: 1 }, { unique: true });
