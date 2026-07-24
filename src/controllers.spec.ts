import { BadRequestException } from '@nestjs/common';
import type { AuthenticatedRequest } from './auth/auth.types';
import { CartsController } from './carts/carts.controller';
import {
  AdminContentController,
  PublicContentController,
} from './content/content.controller';
import {
  AdminOrdersController,
  OrdersController,
} from './orders/orders.controller';
import { ProductsController } from './products/products.controller';
import { ProfilesController } from './profiles/profiles.controller';

const request = {
  auth: {
    payload: {
      sub: 'auth0|member',
      permissions: ['read:orders'],
    },
  },
  headers: {},
} as AuthenticatedRequest;

describe('thin HTTP controllers', () => {
  it('delegates cart operations with the authenticated request', () => {
    const carts = {
      createGuestCart: jest.fn().mockReturnValue('guest'),
      getCurrent: jest.fn().mockReturnValue('current'),
      setItem: jest.fn().mockReturnValue('set'),
      deleteItem: jest.fn().mockReturnValue('deleted'),
      merge: jest.fn().mockReturnValue('merged'),
    };
    const controller = new CartsController(carts as never);
    const item = {
      productSlug: 'mesh-tool',
      variantId: 'standard',
      quantity: 2,
    };

    expect(controller.createGuestCart()).toBe('guest');
    expect(controller.getCart(request)).toBe('current');
    expect(controller.setItem(request, item)).toBe('set');
    expect(controller.deleteItem(request, 'line-1')).toBe('deleted');
    expect(controller.merge(request, { guestToken: 'guest-token' })).toBe(
      'merged',
    );
    expect(carts.setItem).toHaveBeenCalledWith(request, item);
    expect(carts.deleteItem).toHaveBeenCalledWith(request, 'line-1');
    expect(carts.merge).toHaveBeenCalledWith('auth0|member', 'guest-token');
  });

  it('validates product categories and returns donation configuration', () => {
    const products = {
      findAll: jest.fn().mockReturnValue('products'),
      findBySlug: jest.fn().mockReturnValue('product'),
    };
    const config = {
      getOrThrow: jest.fn((key: string) => `${key}-value`),
    };
    const controller = new ProductsController(
      products as never,
      config as never,
    );

    expect(controller.findAll()).toBe('products');
    expect(controller.findAll('laboratory-tools')).toBe('products');
    expect(() => controller.findAll('unknown')).toThrow(BadRequestException);
    expect(controller.findOne('mesh-tool')).toBe('product');
    expect(products.findAll).toHaveBeenNthCalledWith(1, undefined);
    expect(products.findAll).toHaveBeenNthCalledWith(2, 'laboratory-tools');
    expect(controller.getDonationConfig()).toEqual({
      currency: 'USD',
      suggestedShippingCents: 1500,
      paypalUrl: 'PAYPAL_DONATION_URL-value',
      venmoUrl: 'VENMO_DONATION_URL-value',
      paypalHandle: '@trippaardema',
      venmoHandle: '@the_org',
      verification: 'manual',
    });
  });

  it('delegates profile operations and exposes capabilities', async () => {
    const profiles = {
      getOrCreate: jest
        .fn()
        .mockResolvedValueOnce({ shippingAddress: { city: 'Nashville' } })
        .mockResolvedValueOnce({}),
      update: jest.fn().mockReturnValue('updated'),
      updateShipping: jest.fn().mockReturnValue('shipping'),
      deleteShipping: jest.fn().mockReturnValue('deleted'),
    };
    const controller = new ProfilesController(profiles as never);
    const profile = {
      preferredName: 'Member',
      email: 'member@example.test',
      membershipType: 'public' as const,
      contactMethod: 'email' as const,
      contactHandle: 'member@example.test',
      beliefsSummary: '',
    };
    const shipping = {
      recipientName: 'Member',
      line1: '1 Main St',
      city: 'Nashville',
      state: 'TN',
      postalCode: '37201',
      country: 'US' as const,
    };

    await expect(controller.getMe(request)).resolves.toEqual({
      shippingAddress: { city: 'Nashville' },
    });
    expect(controller.getCapabilities(request)).toEqual({
      canManageOrders: false,
      canEditWebsite: false,
      canPublishWebsite: false,
    });
    expect(controller.updateMe(request, profile)).toBe('updated');
    await expect(controller.getShipping(request)).resolves.toBeNull();
    expect(controller.updateShipping(request, shipping)).toBe('shipping');
    expect(controller.deleteShipping(request)).toBe('deleted');
    expect(profiles.update).toHaveBeenCalledWith('auth0|member', profile);
    expect(profiles.updateShipping).toHaveBeenCalledWith(
      'auth0|member',
      shipping,
    );
  });

  it('returns a profile shipping address when one exists', async () => {
    const profiles = {
      getOrCreate: jest
        .fn()
        .mockResolvedValue({ shippingAddress: { city: 'Nashville' } }),
    };
    const controller = new ProfilesController(profiles as never);

    await expect(controller.getShipping(request)).resolves.toEqual({
      city: 'Nashville',
    });
  });

  it('delegates member and administrator order operations', () => {
    const orders = {
      listForMember: jest.fn().mockReturnValue('member-list'),
      findForMember: jest.fn().mockReturnValue('member-order'),
      create: jest.fn().mockReturnValue('created'),
      reportDonation: jest.fn().mockReturnValue('reported'),
      listForAdmin: jest.fn().mockReturnValue('admin-list'),
      findForAdmin: jest.fn().mockReturnValue('admin-order'),
      updateStatus: jest.fn().mockReturnValue('updated'),
    };
    const member = new OrdersController(orders as never);
    const admin = new AdminOrdersController(orders as never);
    const createInput = { declaredDonationCents: 1000 };
    const report = { method: 'paypal' as const, amountCents: 1000 };
    const status = { status: 'preparing' as const };

    expect(member.list(request)).toBe('member-list');
    expect(member.findOne(request, 'order-1')).toBe('member-order');
    expect(member.create(request, 'key-1', createInput)).toBe('created');
    expect(member.reportDonation(request, 'order-1', report)).toBe('reported');
    expect(admin.list()).toBe('admin-list');
    expect(admin.list('preparing')).toBe('admin-list');
    expect(() => admin.list('unknown')).toThrow(BadRequestException);
    expect(admin.findOne('order-1')).toBe('admin-order');
    expect(admin.updateStatus('order-1', status)).toBe('updated');
    expect(orders.create).toHaveBeenCalledWith(
      'auth0|member',
      'key-1',
      createInput,
    );
    expect(orders.listForAdmin).toHaveBeenNthCalledWith(1, undefined);
    expect(orders.listForAdmin).toHaveBeenNthCalledWith(2, 'preparing');
  });

  it('delegates public and administrator content operations', () => {
    const content = {
      listPublic: jest.fn().mockReturnValue('public-list'),
      getPublic: jest.fn().mockReturnValue('public-page'),
      listAdmin: jest.fn().mockReturnValue('admin-list'),
      getAdmin: jest.fn().mockReturnValue('admin-page'),
      saveDraft: jest.fn().mockReturnValue('saved'),
      publish: jest.fn().mockReturnValue('published'),
      discardDraft: jest.fn().mockReturnValue('discarded'),
      restoreRevision: jest.fn().mockReturnValue('restored'),
    };
    const publicController = new PublicContentController(content as never);
    const admin = new AdminContentController(content as never);
    const body = { expectedDraftRevision: 2 };
    const saveBody = {
      expectedDraftRevision: 2,
      content: { title: 'Draft' },
    };

    expect(publicController.list()).toBe('public-list');
    expect(publicController.findOne('community')).toBe('public-page');
    expect(admin.list()).toBe('admin-list');
    expect(admin.findOne('community')).toBe('admin-page');
    expect(admin.saveDraft(request, 'community', saveBody as never)).toBe(
      'saved',
    );
    expect(admin.publish(request, 'community', body)).toBe('published');
    expect(admin.discardDraft('community', body)).toBe('discarded');
    expect(admin.restoreRevision(request, 'community', 1, body)).toBe(
      'restored',
    );
    expect(content.saveDraft).toHaveBeenCalledWith(
      'community',
      2,
      saveBody.content,
      'auth0|member',
    );
    expect(content.restoreRevision).toHaveBeenCalledWith(
      'community',
      1,
      2,
      'auth0|member',
    );
  });
});
