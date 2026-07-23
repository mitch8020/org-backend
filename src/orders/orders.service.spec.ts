import { isOrderTransitionAllowed } from './orders.service';

describe('order status transitions', () => {
  it('allows the fulfillment happy path', () => {
    expect(
      isOrderTransitionAllowed('awaiting_donation', 'donation_reported'),
    ).toBe(true);
    expect(
      isOrderTransitionAllowed('donation_reported', 'donation_confirmed'),
    ).toBe(true);
    expect(isOrderTransitionAllowed('donation_confirmed', 'preparing')).toBe(
      true,
    );
    expect(isOrderTransitionAllowed('preparing', 'shipped')).toBe(true);
    expect(isOrderTransitionAllowed('shipped', 'completed')).toBe(true);
  });

  it('prevents skipping backward or reopening terminal orders', () => {
    expect(isOrderTransitionAllowed('awaiting_donation', 'shipped')).toBe(
      false,
    );
    expect(isOrderTransitionAllowed('completed', 'preparing')).toBe(false);
    expect(isOrderTransitionAllowed('cancelled', 'awaiting_donation')).toBe(
      false,
    );
  });
});
