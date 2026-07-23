import { BadRequestException } from '@nestjs/common';
import { INITIAL_WEBSITE_PAGES } from './initial-content';
import { validateWebsitePageContent } from './content.validation';
import type { AboutPageContent } from './content.types';

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
    const about = structuredClone(
      INITIAL_WEBSITE_PAGES.find((page) => page.id === 'about'),
    ) as AboutPageContent;
    about.contact.channels[0].href = 'javascript:alert(1)';

    expect(() => validateWebsitePageContent('about', about)).toThrow(
      BadRequestException,
    );
  });

  it('rejects duplicated stable IDs', () => {
    const about = structuredClone(
      INITIAL_WEBSITE_PAGES.find((page) => page.id === 'about'),
    ) as AboutPageContent;
    about.articles[1].id = about.articles[0].id;

    expect(() => validateWebsitePageContent('about', about)).toThrow(
      BadRequestException,
    );
  });
});
