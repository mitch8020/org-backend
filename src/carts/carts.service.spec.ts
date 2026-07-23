import { CartsService } from './carts.service';

describe('CartsService', () => {
  it('recalculates suggested amounts from the product catalog', async () => {
    const products = {
      findOrderableVariant: jest.fn().mockResolvedValue({
        product: {
          name: 'Mesh Tool',
          imageUrl: '/offerings/mesh.webp',
          imageAlt: 'Mesh tool',
        },
        variant: {
          id: 'standard',
          label: 'Standard',
          suggestedDonationCents: 1200,
        },
      }),
    };
    const service = new CartsService({} as never, products as never);
    const response = await service.toResponse({
      id: 'cart-1',
      items: [
        {
          itemId: 'line-1',
          productSlug: 'mesh-tool',
          variantId: 'standard',
          quantity: 2,
        },
      ],
      updatedAt: new Date(),
    } as never);

    expect(response).toMatchObject({
      suggestedItemsCents: 2400,
      suggestedShippingCents: 1500,
      suggestedTotalCents: 3900,
    });
    expect(products.findOrderableVariant).toHaveBeenCalledWith(
      'mesh-tool',
      'standard',
    );
  });
});
