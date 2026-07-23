import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductCategory =
  | 'vaporizer-accessories'
  | '3d-printed-parts'
  | 'laboratory-tools';

@Schema({ _id: false })
export class ProductVariant {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  label: string;

  @Prop()
  suggestedDonationCents?: number;

  @Prop({ type: Object, default: {} })
  options: Record<string, string>;
}

export const ProductVariantSchema =
  SchemaFactory.createForClass(ProductVariant);

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  category: ProductCategory;

  @Prop({ required: true })
  summary: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], default: [] })
  specifications: string[];

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ required: true })
  imageAlt: string;

  @Prop({ default: 'active' })
  availability: 'active' | 'made-to-order' | 'paused';

  @Prop({ type: [ProductVariantSchema], required: true })
  variants: ProductVariant[];

  createdAt?: Date;
  updatedAt?: Date;
}

export type ProductDocument = HydratedDocument<Product>;
export const ProductSchema = SchemaFactory.createForClass(Product);
