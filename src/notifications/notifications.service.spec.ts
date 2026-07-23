import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  it('skips email safely when Resend is not configured', async () => {
    const config = {
      get: jest.fn().mockReturnValue(undefined),
      getOrThrow: jest.fn().mockReturnValue('http://localhost:3000'),
    };
    const service = new NotificationsService(config as never);
    await expect(service.sendOrderCreated({} as never)).resolves.toBe(
      'skipped',
    );
  });
});
