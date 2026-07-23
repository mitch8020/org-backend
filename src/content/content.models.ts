import type { WebsitePageContent, WebsitePageId } from './content.types';

export interface StoredPublishedRevision {
  revision: number;
  content: WebsitePageContent;
  publishedAt: Date | string;
  publishedBy: string;
}

export interface StoredDraft {
  revision: number;
  basedOnPublishedRevision: number;
  content: WebsitePageContent;
  updatedAt: Date | string;
  updatedBy: string;
}

export interface StoredWebsitePage {
  pageId: WebsitePageId;
  published: StoredPublishedRevision;
  draft?: StoredDraft | null;
  history?: StoredPublishedRevision[];
}
