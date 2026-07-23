import {
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { INITIAL_WEBSITE_PAGES } from './initial-content';
import type {
  PublishedWebsitePage,
  WebsitePageContent,
  WebsitePageId,
  WebsitePageSummary,
} from './content.types';
import type { StoredWebsitePage } from './content.models';
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
    return pages.map((page) => this.toPublicPage(page));
  }

  async getPublic(pageIdValue: string): Promise<PublishedWebsitePage> {
    const page = await this.findPage(parseWebsitePageId(pageIdValue));
    return this.toPublicPage(page);
  }

  async listAdmin(): Promise<WebsitePageSummary[]> {
    const pages = await this.pageModel.find().sort({ pageId: 1 }).lean().exec();
    return pages.map((page) => ({
      pageId: page.pageId,
      title: page.published.content.title,
      publishedRevision: page.published.revision,
      draftRevision: page.draft?.revision ?? null,
      updatedAt: this.toIso(
        page.draft?.updatedAt ?? page.published.publishedAt,
      ),
    }));
  }

  async getAdmin(pageIdValue: string) {
    const page = await this.findPage(parseWebsitePageId(pageIdValue));
    return this.toAdminPage(page);
  }

  async saveDraft(
    pageIdValue: string,
    expectedDraftRevision: number | null,
    contentValue: unknown,
    actor: string,
  ) {
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
    return this.toAdminPage(updated);
  }

  async publish(
    pageIdValue: string,
    expectedDraftRevision: number | null,
    actor: string,
  ) {
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
    return this.toAdminPage(updated);
  }

  async discardDraft(
    pageIdValue: string,
    expectedDraftRevision: number | null,
  ) {
    const pageId = parseWebsitePageId(pageIdValue);
    const current = await this.findPage(pageId);
    assertExpectedDraftRevision(current, expectedDraftRevision);
    if (expectedDraftRevision === null) return this.toAdminPage(current);
    const updated = await this.pageModel
      .findOneAndUpdate(
        { pageId, 'draft.revision': expectedDraftRevision },
        { $unset: { draft: 1 } },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();
    if (!updated) throwContentConflict();
    return this.toAdminPage(updated);
  }

  async restoreRevision(
    pageIdValue: string,
    revision: number,
    expectedDraftRevision: number | null,
    actor: string,
  ) {
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
    return this.toAdminPage(updated);
  }

  private async findPage(pageId: WebsitePageId) {
    const page = await this.pageModel.findOne({ pageId }).lean().exec();
    if (!page) throw new NotFoundException('That website page does not exist.');
    return page;
  }

  private toPublicPage(page: {
    pageId: WebsitePageId;
    published: {
      revision: number;
      content: WebsitePageContent;
      publishedAt: Date;
    };
  }): PublishedWebsitePage {
    return {
      pageId: page.pageId,
      revision: page.published.revision,
      content: page.published.content,
      publishedAt: this.toIso(page.published.publishedAt),
    };
  }

  private toAdminPage(page: StoredWebsitePage) {
    return {
      pageId: page.pageId,
      published: {
        revision: page.published.revision,
        content: page.published.content,
        publishedAt: this.toIso(page.published.publishedAt),
        publishedBy: page.published.publishedBy,
      },
      draft: page.draft
        ? {
            revision: page.draft.revision,
            basedOnPublishedRevision: page.draft.basedOnPublishedRevision,
            content: page.draft.content,
            updatedAt: this.toIso(page.draft.updatedAt),
            updatedBy: page.draft.updatedBy,
          }
        : null,
      history: (page.history ?? []).map((item) => ({
        revision: item.revision,
        content: item.content,
        publishedAt: this.toIso(item.publishedAt),
        publishedBy: item.publishedBy,
      })),
    };
  }

  private toIso(value: Date | string): string {
    return value instanceof Date
      ? value.toISOString()
      : new Date(value).toISOString();
  }
}
