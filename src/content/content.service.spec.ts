import { ConflictException } from '@nestjs/common';
import { ContentService } from './content.service';
import { INITIAL_WEBSITE_PAGES } from './initial-content';

interface MockQuery<T> {
  lean: () => MockQuery<T>;
  sort: () => MockQuery<T>;
  exec: () => Promise<T>;
}

function query<T>(value: T): MockQuery<T> {
  const result: MockQuery<T> = {
    lean: () => result,
    sort: () => result,
    exec: () => Promise.resolve(value),
  };
  return result;
}

function pageFixture() {
  const content = INITIAL_WEBSITE_PAGES[1];
  return {
    pageId: content.id,
    published: {
      revision: 3,
      content,
      publishedAt: new Date('2026-07-20T00:00:00.000Z'),
      publishedBy: 'auth0|publisher',
    },
    draft: {
      revision: 2,
      basedOnPublishedRevision: 3,
      content: {
        ...content,
        title: 'Edited community',
      },
      updatedAt: new Date('2026-07-21T00:00:00.000Z'),
      updatedBy: 'auth0|editor',
    },
    history: Array.from({ length: 10 }, (_, index) => ({
      revision: 2 - index,
      content,
      publishedAt: new Date('2026-07-19T00:00:00.000Z'),
      publishedBy: 'auth0|publisher',
    })),
  };
}

describe('ContentService', () => {
  it('seeds every page with insert-only updates', async () => {
    const updates: Array<Record<string, unknown>> = [];
    const model = {
      updateOne: jest.fn(
        (_filter: unknown, update: Record<string, unknown>) => {
          updates.push(update);
          return query(undefined);
        },
      ),
    };
    const service = new ContentService(model as never);

    await service.onApplicationBootstrap();

    expect(model.updateOne).toHaveBeenCalledTimes(8);
    for (const update of updates) {
      expect(update).toHaveProperty('$setOnInsert');
      expect(update).not.toHaveProperty('$set');
    }
  });

  it('publishes the expected draft and keeps ten historical revisions', async () => {
    const current = pageFixture();
    const updated = {
      ...current,
      published: {
        revision: 4,
        content: current.draft.content,
        publishedAt: new Date('2026-07-22T00:00:00.000Z'),
        publishedBy: 'auth0|next-publisher',
      },
      draft: undefined,
      history: [current.published, ...current.history].slice(0, 10),
    };
    let publishUpdate:
      | {
          $set: {
            history: Array<{ revision: number }>;
          };
          $unset: { draft: number };
        }
      | undefined;
    let publishFilter: Record<string, unknown> | undefined;
    const findOneAndUpdate = jest.fn(
      (
        _filter: Record<string, unknown>,
        update: {
          $set: {
            history: Array<{ revision: number }>;
          };
          $unset: { draft: number };
        },
      ) => {
        publishFilter = _filter;
        publishUpdate = update;
        return query(updated);
      },
    );
    const model = {
      findOne: jest.fn(() => query(current)),
      findOneAndUpdate,
    };
    const service = new ContentService(model as never);

    const result = await service.publish(
      current.pageId,
      2,
      'auth0|next-publisher',
    );

    expect(publishFilter).toMatchObject({
      pageId: current.pageId,
      'published.revision': 3,
      'draft.revision': 2,
    });
    expect(publishUpdate?.$unset).toEqual({ draft: 1 });
    expect(publishUpdate?.$set.history).toHaveLength(10);
    expect(publishUpdate?.$set.history[0].revision).toBe(3);
    expect(result.published.revision).toBe(4);
    expect(result.draft).toBeNull();
  });

  it('rejects a stale draft revision before writing', async () => {
    const current = pageFixture();
    const model = {
      findOne: jest.fn(() => query(current)),
      findOneAndUpdate: jest.fn(),
    };
    const service = new ContentService(model as never);

    await expect(
      service.saveDraft(
        current.pageId,
        1,
        current.draft.content,
        'auth0|editor',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(model.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('discards only the expected draft revision', async () => {
    const current = pageFixture();
    const updated = { ...current, draft: undefined };
    let discardFilter: Record<string, unknown> | undefined;
    const model = {
      findOne: jest.fn(() => query(current)),
      findOneAndUpdate: jest.fn((filter: Record<string, unknown>) => {
        discardFilter = filter;
        return query(updated);
      }),
    };
    const service = new ContentService(model as never);

    const result = await service.discardDraft(current.pageId, 2);

    expect(discardFilter).toEqual({
      pageId: current.pageId,
      'draft.revision': 2,
    });
    expect(result.draft).toBeNull();
    expect(result.published.revision).toBe(3);
  });

  it('restores an archived revision into a new draft without publishing it', async () => {
    const current = pageFixture();
    const source = current.history[1];
    let restoreFilter: Record<string, unknown> | undefined;
    let restoreUpdate: Record<string, unknown> | undefined;
    const updated = {
      ...current,
      draft: {
        revision: 3,
        basedOnPublishedRevision: 3,
        content: source.content,
        updatedAt: new Date('2026-07-23T00:00:00.000Z'),
        updatedBy: 'auth0|restorer',
      },
    };
    const model = {
      findOne: jest.fn(() => query(current)),
      findOneAndUpdate: jest.fn(
        (filter: Record<string, unknown>, update: Record<string, unknown>) => {
          restoreFilter = filter;
          restoreUpdate = update;
          return query(updated);
        },
      ),
    };
    const service = new ContentService(model as never);

    const result = await service.restoreRevision(
      current.pageId,
      source.revision,
      2,
      'auth0|restorer',
    );

    expect(restoreFilter).toMatchObject({
      pageId: current.pageId,
      'published.revision': 3,
      'draft.revision': 2,
    });
    expect(restoreUpdate).toHaveProperty('$set.draft.content', source.content);
    expect(result.published.revision).toBe(3);
    expect(result.draft?.revision).toBe(3);
    expect(result.draft?.content).toEqual(source.content);
  });
});
