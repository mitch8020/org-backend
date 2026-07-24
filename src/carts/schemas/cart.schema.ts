import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ _id: false })
export class CartItem {
  @Prop({ type: String, required: true })
  itemId: string;

  @Prop({ type: String, required: true })
  productSlug: string;

  @Prop({ type: String, required: true })
  variantId: string;

  @Prop({ type: Number, required: true, min: 1, max: 10 })
  quantity: number;

  @Prop({ type: String, maxlength: 500 })
  note?: string;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);

@Schema({ timestamps: true })
export class Cart {
  @Prop({ type: String })
  ownerSub?: string;

  @Prop({ type: String })
  guestTokenHash?: string;

  @Prop({ type: [CartItemSchema], default: [] })
  items: CartItem[];

  @Prop({ type: Date })
  expiresAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export type CartDocument = HydratedDocument<Cart>;
export const CartSchema = SchemaFactory.createForClass(Cart);

CartSchema.index(
  { ownerSub: 1 },
  {
    unique: true,
    partialFilterExpression: { ownerSub: { $type: 'string' } },
  },
);
CartSchema.index(
  { guestTokenHash: 1 },
  {
    unique: true,
    partialFilterExpression: { guestTokenHash: { $type: 'string' } },
  },
);
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
