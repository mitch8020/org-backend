import { BadRequestException } from '@nestjs/common';
import {
  WEBSITE_PAGE_IDS,
  type AboutOutlineNode,
  type WebsitePageContent,
  type WebsitePageId,
} from './content.types';

const MAX_PAGE_CHARACTERS = 250_000;
const MAX_BLOCKS = 2_000;
const MAX_OUTLINE_DEPTH = 10;
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,119}$/;
const ROMAN_PATTERN = /^[IVXLCDM]{1,16}$/;
const MARKER_PATTERN = /^.{1,16}$/u;
const HTTP_URL_PATTERN = /^https?:\/\//i;
const MARKDOWN_LINK_PATTERN = /\[[^\]]+\]\(([^)\s]+)\)/g;

type RecordValue = Record<string, unknown>;

function fail(message: string): never {
  throw new BadRequestException(message);
}

function record(value: unknown, label: string): RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${label} must be an object.`);
  }
  return value as RecordValue;
}

function array(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) fail(`${label} must be an array.`);
  return value;
}

function text(
  value: unknown,
  label: string,
  maxLength: number,
  allowEmpty = false,
): string {
  if (typeof value !== 'string') fail(`${label} must be text.`);
  const normalized = value.trim();
  if (!allowEmpty && !normalized) fail(`${label} is required.`);
  if (normalized.length > maxLength) {
    fail(`${label} must be ${maxLength} characters or fewer.`);
  }
  validateMarkdownLinks(normalized, label);
  return normalized;
}

function identifier(value: unknown, label: string): string {
  const id = text(value, label, 120);
  if (!ID_PATTERN.test(id)) {
    fail(`${label} may contain lowercase letters, numbers, and hyphens only.`);
  }
  return id;
}

function validateMarkdownLinks(value: string, label: string) {
  for (const match of value.matchAll(MARKDOWN_LINK_PATTERN)) {
    if (!HTTP_URL_PATTERN.test(match[1])) {
      fail(`${label} contains a link that is not HTTP or HTTPS.`);
    }
  }
}

function pageTextLength(content: WebsitePageContent): number {
  const values: string[] = [];
  const walk = (nodes: AboutOutlineNode[]) => {
    for (const node of nodes) {
      values.push(node.marker, node.text);
      walk(node.children);
    }
  };

  if (content.kind === 'reference') {
    values.push(content.title, content.subtitle);
    for (const block of content.blocks) {
      values.push(block.text, block.marker ?? '');
    }
  } else {
    values.push(
      content.title,
      content.statusNote,
      content.contact.roman,
      content.contact.eyebrow,
      content.contact.intro,
    );
    for (const article of content.articles) {
      values.push(article.roman, article.eyebrow, article.lead);
      walk(article.body);
    }
    for (const channel of content.contact.channels) {
      values.push(channel.label, channel.handle, channel.href ?? '');
    }
  }
  return values.reduce((total, value) => total + value.length, 0);
}

function validateUniqueId(id: string, ids: Set<string>) {
  if (ids.has(id)) fail(`Content ID "${id}" is duplicated.`);
  ids.add(id);
}

function validateAboutNode(
  value: unknown,
  ids: Set<string>,
  count: { value: number },
  depth: number,
): AboutOutlineNode {
  if (depth > MAX_OUTLINE_DEPTH) {
    fail(
      `About page outlines may be at most ${MAX_OUTLINE_DEPTH} levels deep.`,
    );
  }
  count.value += 1;
  if (count.value > MAX_BLOCKS) {
    fail(`About page may contain at most ${MAX_BLOCKS} outline rows.`);
  }
  const input = record(value, 'Outline row');
  const id = identifier(input.id, 'Outline row ID');
  validateUniqueId(id, ids);
  const marker = text(input.marker, 'Outline marker', 16);
  if (!MARKER_PATTERN.test(marker)) fail('Outline marker is invalid.');
  const nodeText = text(input.text, 'Outline text', 12_000);
  const children = array(input.children, 'Outline children').map((child) =>
    validateAboutNode(child, ids, count, depth + 1),
  );
  return { id, marker, text: nodeText, children };
}

function validateAbout(input: RecordValue): WebsitePageContent {
  if (input.id !== 'about') fail('About content must use the "about" page ID.');
  const ids = new Set<string>();
  const count = { value: 0 };
  const articles = array(input.articles, 'About articles');
  if (articles.length < 1 || articles.length > 30) {
    fail('About page must contain between 1 and 30 articles.');
  }

  const normalizedArticles = articles.map((value, index) => {
    const article = record(value, `Article ${index + 1}`);
    const id = identifier(article.id, `Article ${index + 1} ID`);
    validateUniqueId(id, ids);
    const roman = text(article.roman, `Article ${index + 1} numeral`, 16);
    if (!ROMAN_PATTERN.test(roman)) {
      fail(`Article ${index + 1} numeral must be a Roman numeral.`);
    }
    return {
      id,
      roman,
      eyebrow: text(article.eyebrow, `Article ${index + 1} title`, 120),
      lead: text(article.lead, `Article ${index + 1} lead`, 12_000),
      body: array(article.body, `Article ${index + 1} body`).map((node) =>
        validateAboutNode(node, ids, count, 1),
      ),
    };
  });

  const contact = record(input.contact, 'Contact section');
  const channels = array(contact.channels, 'Contact channels');
  if (channels.length < 1 || channels.length > 10) {
    fail('Contact section must contain between 1 and 10 channels.');
  }
  const normalizedChannels = channels.map((value, index) => {
    const channel = record(value, `Contact channel ${index + 1}`);
    const id = identifier(channel.id, `Contact channel ${index + 1} ID`);
    validateUniqueId(id, ids);
    let href: string | null = null;
    if (channel.href !== null && channel.href !== undefined) {
      href = text(channel.href, `Contact channel ${index + 1} link`, 2_000);
      if (!HTTP_URL_PATTERN.test(href)) {
        fail(`Contact channel ${index + 1} link must be HTTP or HTTPS.`);
      }
    }
    return {
      id,
      label: text(channel.label, `Contact channel ${index + 1} label`, 120),
      handle: text(channel.handle, `Contact channel ${index + 1} handle`, 120),
      href,
    };
  });

  const normalized: WebsitePageContent = {
    kind: 'about',
    id: 'about',
    title: text(input.title, 'About title', 120),
    statusNote: text(input.statusNote, 'About status note', 500),
    articles: normalizedArticles,
    contact: {
      roman: text(contact.roman, 'Contact numeral', 16),
      eyebrow: text(contact.eyebrow, 'Contact title', 120),
      intro: text(contact.intro, 'Contact introduction', 1_000),
      channels: normalizedChannels,
    },
  };
  if (!ROMAN_PATTERN.test(normalized.contact.roman)) {
    fail('Contact numeral must be a Roman numeral.');
  }
  return normalized;
}

function validateReference(
  input: RecordValue,
  pageId: Exclude<WebsitePageId, 'about'>,
): WebsitePageContent {
  if (input.id !== pageId) {
    fail(`Content page ID must match "${pageId}".`);
  }
  const ids = new Set<string>();
  const blocks = array(input.blocks, 'Page blocks');
  if (blocks.length < 1 || blocks.length > MAX_BLOCKS) {
    fail(`Page must contain between 1 and ${MAX_BLOCKS} blocks.`);
  }
  const normalizedBlocks = blocks.map((value, index) => {
    const block = record(value, `Block ${index + 1}`);
    const id = identifier(block.id, `Block ${index + 1} ID`);
    validateUniqueId(id, ids);
    if (
      block.kind !== 'lead' &&
      block.kind !== 'heading' &&
      block.kind !== 'paragraph' &&
      block.kind !== 'outline'
    ) {
      fail(`Block ${index + 1} has an unknown kind.`);
    }
    const normalized = {
      id,
      kind: block.kind,
      text: text(block.text, `Block ${index + 1} text`, 12_000),
    } as {
      id: string;
      kind: 'lead' | 'heading' | 'paragraph' | 'outline';
      text: string;
      marker?: string;
      depth?: number;
    };
    if (block.kind === 'outline') {
      normalized.marker = text(block.marker, `Block ${index + 1} marker`, 16);
      if (
        typeof block.depth !== 'number' ||
        !Number.isInteger(block.depth) ||
        block.depth < 0 ||
        block.depth > 4
      ) {
        fail(`Block ${index + 1} depth must be between 0 and 4.`);
      }
      normalized.depth = block.depth;
    }
    return normalized;
  });

  return {
    kind: 'reference',
    id: pageId,
    title: text(input.title, 'Page title', 120),
    subtitle: text(input.subtitle, 'Page subtitle', 500),
    blocks: normalizedBlocks,
  };
}

export function parseWebsitePageId(value: string): WebsitePageId {
  if (!(WEBSITE_PAGE_IDS as readonly string[]).includes(value)) {
    fail('Unknown website page.');
  }
  return value as WebsitePageId;
}

export function validateWebsitePageContent(
  pageId: WebsitePageId,
  value: unknown,
): WebsitePageContent {
  const input = record(value, 'Page content');
  const normalized =
    pageId === 'about'
      ? validateAbout(input)
      : validateReference(input, pageId);
  if (pageTextLength(normalized) > MAX_PAGE_CHARACTERS) {
    fail(`Page content may contain at most ${MAX_PAGE_CHARACTERS} characters.`);
  }
  return normalized;
}
