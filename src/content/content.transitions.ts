import { ConflictException, NotFoundException } from '@nestjs/common';
import type {
  StoredDraft,
  StoredPublishedRevision,
  StoredWebsitePage,
} from './content.models';
import type { WebsitePageContent } from './content.types';

const HISTORY_LIMIT = 10;

export interface PublicationTransition {
  published: StoredPublishedRevision;
  history: StoredPublishedRevision[];
}

export function createDraft(
  page: StoredWebsitePage,
  expectedDraftRevision: number | null,
  content: WebsitePageContent,
  actor: string,
  updatedAt: Date,
): StoredDraft {
  assertExpectedDraftRevision(page, expectedDraftRevision);
  return buildDraft(page, expectedDraftRevision, content, actor, updatedAt);
}

export function createPublication(
  page: StoredWebsitePage,
  expectedDraftRevision: number | null,
  actor: string,
  publishedAt: Date,
): PublicationTransition {
  assertExpectedDraftRevision(page, expectedDraftRevision);
  if (!page.draft || expectedDraftRevision === null) {
    throw new ConflictException('Save a draft before publishing.');
  }
  if (page.draft.basedOnPublishedRevision !== page.published.revision) {
    throwContentConflict();
  }

  return {
    published: {
      revision: page.published.revision + 1,
      content: page.draft.content,
      publishedAt,
      publishedBy: actor,
    },
    history: [page.published, ...(page.history ?? [])].slice(0, HISTORY_LIMIT),
  };
}

export function createRestoredDraft(
  page: StoredWebsitePage,
  revision: number,
  expectedDraftRevision: number | null,
  actor: string,
  updatedAt: Date,
): StoredDraft {
  assertExpectedDraftRevision(page, expectedDraftRevision);
  const source = page.history?.find((item) => item.revision === revision);
  if (!source) {
    throwMissingRevision();
  }
  return buildDraft(
    page,
    expectedDraftRevision,
    source.content,
    actor,
    updatedAt,
  );
}

export function assertExpectedDraftRevision(
  page: StoredWebsitePage,
  expectedDraftRevision: number | null,
) {
  if ((page.draft?.revision ?? null) !== expectedDraftRevision) {
    throwContentConflict();
  }
}

export function assertHistoricalRevision(revision: number) {
  if (!Number.isInteger(revision) || revision < 1) {
    throwMissingRevision();
  }
}

export function throwContentConflict(): never {
  throw new ConflictException(
    'This page changed in another session. Reload it before continuing.',
  );
}

function buildDraft(
  page: StoredWebsitePage,
  expectedDraftRevision: number | null,
  content: WebsitePageContent,
  actor: string,
  updatedAt: Date,
): StoredDraft {
  return {
    revision: (expectedDraftRevision ?? 0) + 1,
    basedOnPublishedRevision: page.published.revision,
    content,
    updatedAt,
    updatedBy: actor,
  };
}

function throwMissingRevision(): never {
  throw new NotFoundException('That published revision does not exist.');
}
