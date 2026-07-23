import type {
  StoredPublishedRevision,
  StoredWebsitePage,
} from './content.models';
import type {
  AdminWebsitePage,
  ContentRevision,
  PublishedWebsitePage,
  WebsitePageSummary,
} from './content.types';

export function toPublicWebsitePage(
  page: StoredWebsitePage,
): PublishedWebsitePage {
  return {
    pageId: page.pageId,
    revision: page.published.revision,
    content: page.published.content,
    publishedAt: toIso(page.published.publishedAt),
  };
}

export function toWebsitePageSummary(
  page: StoredWebsitePage,
): WebsitePageSummary {
  return {
    pageId: page.pageId,
    title: page.published.content.title,
    publishedRevision: page.published.revision,
    draftRevision: page.draft?.revision ?? null,
    updatedAt: toIso(page.draft?.updatedAt ?? page.published.publishedAt),
  };
}

export function toAdminWebsitePage(page: StoredWebsitePage): AdminWebsitePage {
  return {
    pageId: page.pageId,
    published: toContentRevision(page.published),
    draft: page.draft
      ? {
          revision: page.draft.revision,
          basedOnPublishedRevision: page.draft.basedOnPublishedRevision,
          content: page.draft.content,
          updatedAt: toIso(page.draft.updatedAt),
          updatedBy: page.draft.updatedBy,
        }
      : null,
    history: (page.history ?? []).map(toContentRevision),
  };
}

function toContentRevision(revision: StoredPublishedRevision): ContentRevision {
  return {
    revision: revision.revision,
    content: revision.content,
    publishedAt: toIso(revision.publishedAt),
    publishedBy: revision.publishedBy,
  };
}

function toIso(value: Date | string): string {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}
