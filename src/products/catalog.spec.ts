import { INITIAL_PRODUCTS } from './catalog';

describe('initial offerings catalog', () => {
  it('contains the seven approved legal physical offerings', () => {
    expect(INITIAL_PRODUCTS).toHaveLength(7);
    expect(new Set(INITIAL_PRODUCTS.map((product) => product.slug)).size).toBe(
      7,
    );
    expect(
      INITIAL_PRODUCTS.every((product) => product.availability !== 'paused'),
    ).toBe(true);
  });

  it('keeps exact suggested values where the source content supplied them', () => {
    const molecule = INITIAL_PRODUCTS.find(
      (product) => product.slug === 'molecule-model',
    );
    const petg = INITIAL_PRODUCTS.find(
      (product) => product.slug === 'petg-drip-tips',
    );
    expect(
      molecule?.variants.map((variant) => variant.suggestedDonationCents),
    ).toEqual([2500, 1500, 3000, 2000, 1000, 4500]);
    expect(
      petg?.variants.map((variant) => variant.suggestedDonationCents),
    ).toEqual([1000, 1500]);
  });
});
