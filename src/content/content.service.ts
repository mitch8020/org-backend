import {
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { INITIAL_WEBSITE_PAGES } from './initial-content';
import type {
  AdminWebsitePage,
  PublishedWebsitePage,
  WebsitePageId,
  WebsitePageSummary,
} from './content.types';
import {
  toAdminWebsitePage,
  toPublicWebsitePage,
  toWebsitePageSummary,
} from './content.presenters';
import {
  assertExpectedDraftRevision,
  assertHistoricalRevision,
  createDraft,
  createPublication,
  createRestoredDraft,
  throwContentConflict,
} from './content.transitions';
import {
  parseWebsitePageId,
  validateWebsitePageContent,
} from './content.validation';
import {
  WebsitePage,
  type WebsitePageDocument,
} from './schemas/website-page.schema';

const SEED_ACTOR = 'system:initial-content';

@Injectable()
export class ContentService implements OnApplicationBootstrap {
  constructor(
    @InjectModel(WebsitePage.name)
    private readonly pageModel: Model<WebsitePageDocument>,
  ) {}

  async onApplicationBootstrap() {
    const publishedAt = new Date();
    await Promise.all(
      INITIAL_WEBSITE_PAGES.map((content) =>
        this.pageModel
          .updateOne(
            { pageId: content.id },
            {
              $setOnInsert: {
                pageId: content.id,
                published: {
                  revision: 1,
                  content,
                  publishedAt,
                  publishedBy: SEED_ACTOR,
                },
                history: [],
              },
            },
            { upsert: true, setDefaultsOnInsert: true },
          )
          .exec(),
      ),
    );
  }

  async listPublic(): Promise<PublishedWebsitePage[]> {
    const pages = await this.pageModel.find().sort({ pageId: 1 }).lean().exec();
    return pages.map(toPublicWebsitePage);
  }

  async getPublic(pageIdValue: string): Promise<PublishedWebsitePage> {
    const page = await this.findPage(parseWebsitePageId(pageIdValue));
    return toPublicWebsitePage(page);
  }

  async listAdmin(): Promise<WebsitePageSummary[]> {
    const pages = await this.pageModel.find().sort({ pageId: 1 }).lean().exec();
    return pages.map(toWebsitePageSummary);
  }

  async getAdmin(pageIdValue: string): Promise<AdminWebsitePage> {
    const page = await this.findPage(parseWebsitePageId(pageIdValue));
    return toAdminWebsitePage(page);
  }

  async saveDraft(
    pageIdValue: string,
    expectedDraftRevision: number | null,
    contentValue: unknown,
    actor: string,
  ): Promise<AdminWebsitePage> {
    const pageId = parseWebsitePageId(pageIdValue);
    const content = validateWebsitePageContent(pageId, contentValue);
    const current = await this.findPage(pageId);
    const draft = createDraft(
      current,
      expectedDraftRevision,
      content,
      actor,
      new Date(),
    );
    const updated = await this.pageModel
      .findOneAndUpdate(
        {
          pageId,
          'published.revision': current.published.revision,
          ...(expectedDraftRevision === null
            ? { draft: { $exists: false } }
            : { 'draft.revision': expectedDraftRevision }),
        },
        {
          $set: { draft },
        },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();
    if (!updated) throwContentConflict();
    return toAdminWebsitePage(updated);
  }

  async publish(
    pageIdValue: string,
    expectedDraftRevision: number | null,
    actor: string,
  ): Promise<AdminWebsitePage> {
    const pageId = parseWebsitePageId(pageIdValue);
    const current = await this.findPage(pageId);
    const { published, history } = createPublication(
      current,
      expectedDraftRevision,
      actor,
      new Date(),
    );

    const updated = await this.pageModel
      .findOneAndUpdate(
        {
          pageId,
          'published.revision': current.published.revision,
          'draft.revision': expectedDraftRevision,
          'draft.basedOnPublishedRevision': current.published.revision,
        },
        {
          $set: { published, history },
          $unset: { draft: 1 },
        },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();
    if (!updated) throwContentConflict();
    return toAdminWebsitePage(updated);
  }

  async discardDraft(
    pageIdValue: string,
    expectedDraftRevision: number | null,
  ): Promise<AdminWebsitePage> {
    const pageId = parseWebsitePageId(pageIdValue);
    const current = await this.findPage(pageId);
    assertExpectedDraftRevision(current, expectedDraftRevision);
    if (expectedDraftRevision === null) return toAdminWebsitePage(current);
    const updated = await this.pageModel
      .findOneAndUpdate(
        { pageId, 'draft.revision': expectedDraftRevision },
        { $unset: { draft: 1 } },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();
    if (!updated) throwContentConflict();
    return toAdminWebsitePage(updated);
  }

  async restoreRevision(
    pageIdValue: string,
    revision: number,
    expectedDraftRevision: number | null,
    actor: string,
  ): Promise<AdminWebsitePage> {
    const pageId = parseWebsitePageId(pageIdValue);
    assertHistoricalRevision(revision);
    const current = await this.findPage(pageId);
    const draft = createRestoredDraft(
      current,
      revision,
      expectedDraftRevision,
      actor,
      new Date(),
    );
    const updated = await this.pageModel
      .findOneAndUpdate(
        {
          pageId,
          'published.revision': current.published.revision,
          ...(expectedDraftRevision === null
            ? { draft: { $exists: false } }
            : { 'draft.revision': expectedDraftRevision }),
        },
        {
          $set: { draft },
        },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();
    if (!updated) throwContentConflict();
    return toAdminWebsitePage(updated);
  }

  private async findPage(pageId: WebsitePageId) {
    const page = await this.pageModel.findOne({ pageId }).lean().exec();
    if (!page) throw new NotFoundException('That website page does not exist.');
    return page;
  }
}
