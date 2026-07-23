import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AdminContentController,
  PublicContentController,
} from './content.controller';
import { ContentService } from './content.service';
import { WebsitePage, WebsitePageSchema } from './schemas/website-page.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: WebsitePage.name,
        schema: WebsitePageSchema,
      },
    ]),
  ],
  controllers: [PublicContentController, AdminContentController],
  providers: [ContentService],
})
export class ContentModule {}
