import { NotFoundException } from '@nestjs/common';
import { INITIAL_PRODUCTS } from './catalog';
import { ProductsService } from './products.service';

function query<T>(value: T) {
  const chain = {
    sort: jest.fn(),
    lean: jest.fn(),
    exec: jest.fn().mockResolvedValue(value),
  };
  chain.sort.mockReturnValue(chain);
  chain.lean.mockReturnValue(chain);
  return chain;
}

describe('ProductsService', () => {
  it('upserts the static catalog on bootstrap', async () => {
    const model = {
      updateOne: jest.fn(() => ({
        exec: jest.fn().mockResolvedValue(undefined),
      })),
    };
    const service = new ProductsService(model as never);

    await service.onApplicationBootstrap();

    expect(model.updateOne).toHaveBeenCalledTimes(INITIAL_PRODUCTS.length);
    expect(model.updateOne).toHaveBeenCalledWith(
      { slug: INITIAL_PRODUCTS[0].slug },
      { $set: INITIAL_PRODUCTS[0] },
      { upsert: true, setDefaultsOnInsert: true },
    );
  });

  it.each([
    [undefined, {}],
    ['laboratory-tools', { category: 'laboratory-tools' }],
  ])(
    'lists products using the expected category filter',
    async (category, filter) => {
      const findQuery = query([{ slug: 'mesh-tool' }]);
      const model = { find: jest.fn(() => findQuery) };
      const service = new ProductsService(model as never);

      await expect(service.findAll(category as never)).resolves.toEqual([
        { slug: 'mesh-tool' },
      ]);
      expect(model.find).toHaveBeenCalledWith(filter);
      expect(findQuery.sort).toHaveBeenCalledWith({ category: 1, name: 1 });
    },
  );

  it('finds a product by slug', async () => {
    const product = { slug: 'mesh-tool' };
    const model = { findOne: jest.fn(() => query(product)) };

    await expect(
      new ProductsService(model as never).findBySlug('mesh-tool'),
    ).resolves.toBe(product);
  });

  it('rejects a missing product', async () => {
    const model = { findOne: jest.fn(() => query(null)) };

    await expect(
      new ProductsService(model as never).findBySlug('missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns an orderable product variant', async () => {
    const product = {
      slug: 'mesh-tool',
      availability: 'active',
      variants: [{ id: 'standard' }],
    };
    const service = new ProductsService({} as never);
    jest.spyOn(service, 'findBySlug').mockResolvedValue(product as never);

    await expect(
      service.findOrderableVariant('mesh-tool', 'standard'),
    ).resolves.toEqual({ product, variant: product.variants[0] });
  });

  it.each([
    [
      { availability: 'paused', variants: [{ id: 'standard' }] },
      'That offering is not currently orderable.',
    ],
    [
      { availability: 'active', variants: [] },
      'That offering option is not available.',
    ],
  ])('rejects an unavailable variant', async (product, message) => {
    const service = new ProductsService({} as never);
    jest.spyOn(service, 'findBySlug').mockResolvedValue(product as never);

    await expect(
      service.findOrderableVariant('mesh-tool', 'standard'),
    ).rejects.toMatchObject({ message });
  });
});
