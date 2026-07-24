import { BadRequestException } from '@nestjs/common';
import { INITIAL_WEBSITE_PAGES } from './initial-content';
import {
  parseWebsitePageId,
  validateWebsitePageContent,
} from './content.validation';
import type {
  AboutOutlineNode,
  AboutPageContent,
  ReferencePageContent,
} from './content.types';

function aboutPage() {
  return structuredClone(
    INITIAL_WEBSITE_PAGES.find((page) => page.id === 'about'),
  ) as AboutPageContent;
}

function referencePage() {
  return structuredClone(
    INITIAL_WEBSITE_PAGES.find((page) => page.id === 'community'),
  ) as ReferencePageContent;
}

describe('website content validation', () => {
  it('accepts every migrated website page', () => {
    for (const page of INITIAL_WEBSITE_PAGES) {
      expect(validateWebsitePageContent(page.id, page)).toEqual(page);
    }
  });

  it('rejects mismatched page identifiers', () => {
    const community = INITIAL_WEBSITE_PAGES.find(
      (page) => page.id === 'community',
    );
    expect(() => validateWebsitePageContent('beliefs', community)).toThrow(
      BadRequestException,
    );
  });

  it('rejects unsafe contact links', () => {
    const about = aboutPage();
    about.contact.channels[0].href = 'javascript:alert(1)';

    expect(() => validateWebsitePageContent('about', about)).toThrow(
      BadRequestException,
    );
  });

  it('rejects duplicated stable IDs', () => {
    const about = aboutPage();
    about.articles[1].id = about.articles[0].id;

    expect(() => validateWebsitePageContent('about', about)).toThrow(
      BadRequestException,
    );
  });

  it('rejects an unknown page identifier', () => {
    expect(() => parseWebsitePageId('unknown')).toThrow(
      'Unknown website page.',
    );
  });

  it.each([
    ['a non-object page', null, 'Page content must be an object.'],
    [
      'a non-array block list',
      { ...referencePage(), blocks: 'blocks' },
      'Page blocks must be an array.',
    ],
    [
      'a non-text title',
      { ...referencePage(), title: 7 },
      'Page title must be text.',
    ],
    [
      'an empty title',
      { ...referencePage(), title: '   ' },
      'Page title is required.',
    ],
    [
      'an overlong title',
      { ...referencePage(), title: 'x'.repeat(121) },
      'Page title must be 120 characters or fewer.',
    ],
    [
      'an unsafe Markdown link',
      {
        ...referencePage(),
        title: '[unsafe](javascript:alert)',
      },
      'Page title contains a link that is not HTTP or HTTPS.',
    ],
    [
      'an invalid block identifier',
      {
        ...referencePage(),
        blocks: [
          {
            id: 'Invalid ID',
            kind: 'paragraph',
            text: 'Text',
          },
        ],
      },
      'Block 1 ID may contain lowercase letters',
    ],
  ])('rejects %s', (_name, value, message) => {
    expect(() => validateWebsitePageContent('community', value)).toThrow(
      message,
    );
  });

  it('rejects an about page with the wrong embedded ID', () => {
    const about = aboutPage();
    about.id = 'community' as never;

    expect(() => validateWebsitePageContent('about', about)).toThrow(
      'About content must use the "about" page ID.',
    );
  });

  it.each([
    ['no articles', []],
    ['too many articles', Array.from({ length: 31 }, () => ({}))],
  ])('rejects an about page with %s', (_name, articles) => {
    const about = aboutPage();
    about.articles = articles as never;

    expect(() => validateWebsitePageContent('about', about)).toThrow(
      'About page must contain between 1 and 30 articles.',
    );
  });

  it('rejects an invalid article Roman numeral', () => {
    const about = aboutPage();
    about.articles[0].roman = '12';

    expect(() => validateWebsitePageContent('about', about)).toThrow(
      'Article 1 numeral must be a Roman numeral.',
    );
  });

  it.each([
    ['no contact channels', []],
    ['too many contact channels', Array.from({ length: 11 }, () => ({}))],
  ])('rejects an about page with %s', (_name, channels) => {
    const about = aboutPage();
    about.contact.channels = channels as never;

    expect(() => validateWebsitePageContent('about', about)).toThrow(
      'Contact section must contain between 1 and 10 channels.',
    );
  });

  it('rejects an invalid contact Roman numeral', () => {
    const about = aboutPage();
    about.contact.roman = 'CONTACT';

    expect(() => validateWebsitePageContent('about', about)).toThrow(
      'Contact numeral must be a Roman numeral.',
    );
  });

  it('rejects an outline deeper than ten levels', () => {
    const about = aboutPage();
    let node: AboutOutlineNode = {
      id: 'depth-11',
      marker: '1.',
      text: 'Deep',
      children: [],
    };
    for (let depth = 10; depth >= 1; depth -= 1) {
      node = {
        id: `depth-${depth}`,
        marker: '1.',
        text: 'Deep',
        children: [node],
      };
    }
    about.articles[0].body = [node];

    expect(() => validateWebsitePageContent('about', about)).toThrow(
      'About page outlines may be at most 10 levels deep.',
    );
  });

  it('rejects more than two thousand outline rows', () => {
    const about = aboutPage();
    about.articles[0].body = Array.from({ length: 2001 }, (_, index) => ({
      id: `row-${index}`,
      marker: '1.',
      text: 'Row',
      children: [],
    }));

    expect(() => validateWebsitePageContent('about', about)).toThrow(
      'About page may contain at most 2000 outline rows.',
    );
  });

  it('rejects a multiline outline marker', () => {
    const about = aboutPage();
    about.articles[0].body[0].marker = 'a\nb';

    expect(() => validateWebsitePageContent('about', about)).toThrow(
      'Outline marker is invalid.',
    );
  });

  it.each([
    ['no blocks', []],
    [
      'too many blocks',
      Array.from({ length: 2001 }, (_, index) => ({
        id: `block-${index}`,
        kind: 'paragraph',
        text: 'Text',
      })),
    ],
  ])('rejects a reference page with %s', (_name, blocks) => {
    const page = referencePage();
    page.blocks = blocks as never;

    expect(() => validateWebsitePageContent('community', page)).toThrow(
      'Page must contain between 1 and 2000 blocks.',
    );
  });

  it('rejects an unknown reference block kind', () => {
    const page = referencePage();
    page.blocks[0].kind = 'unknown' as never;

    expect(() => validateWebsitePageContent('community', page)).toThrow(
      'Block 1 has an unknown kind.',
    );
  });

  it.each([
    ['a missing depth', undefined],
    ['a fractional depth', 1.5],
    ['a negative depth', -1],
    ['a depth greater than four', 5],
  ])('rejects an outline block with %s', (_name, depth) => {
    const page = referencePage();
    page.blocks = [
      {
        id: 'outline',
        kind: 'outline',
        marker: '1.',
        text: 'Outline',
        depth,
      },
    ] as never;

    expect(() => validateWebsitePageContent('community', page)).toThrow(
      'Block 1 depth must be between 0 and 4.',
    );
  });

  it('rejects a page whose combined content exceeds the page limit', () => {
    const page = referencePage();
    page.blocks = Array.from({ length: 22 }, (_, index) => ({
      id: `block-${index}`,
      kind: 'paragraph',
      text: 'x'.repeat(12_000),
    }));

    expect(() => validateWebsitePageContent('community', page)).toThrow(
      'Page content may contain at most 250000 characters.',
    );
  });
});
