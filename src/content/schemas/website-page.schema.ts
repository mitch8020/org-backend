import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import type { WebsitePageContent, WebsitePageId } from '../content.types';

@Schema({ _id: false })
export class PublishedRevision {
  @Prop({ required: true, min: 1 })
  revision: number;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  content: WebsitePageContent;

  @Prop({ required: true })
  publishedAt: Date;

  @Prop({ required: true })
  publishedBy: string;
}

export const PublishedRevisionSchema =
  SchemaFactory.createForClass(PublishedRevision);

@Schema({ _id: false })
export class WebsiteDraft {
  @Prop({ required: true, min: 1 })
  revision: number;

  @Prop({ required: true, min: 1 })
  basedOnPublishedRevision: number;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  content: WebsitePageContent;

  @Prop({ required: true })
  updatedAt: Date;

  @Prop({ required: true })
  updatedBy: string;
}

export const WebsiteDraftSchema = SchemaFactory.createForClass(WebsiteDraft);

@Schema({ timestamps: true })
export class WebsitePage {
  @Prop({ type: String, required: true, unique: true, index: true })
  pageId: WebsitePageId;

  @Prop({ type: PublishedRevisionSchema, required: true })
  published: PublishedRevision;

  @Prop({ type: WebsiteDraftSchema })
  draft?: WebsiteDraft;

  @Prop({ type: [PublishedRevisionSchema], default: [] })
  history: PublishedRevision[];

  createdAt?: Date;
  updatedAt?: Date;
}

export type WebsitePageDocument = HydratedDocument<WebsitePage>;
export const WebsitePageSchema = SchemaFactory.createForClass(WebsitePage);
