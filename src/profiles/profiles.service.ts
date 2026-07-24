import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  MemberProfile,
  MemberProfileDocument,
} from './schemas/member-profile.schema';
import type { Auth0Identity } from '../auth/auth0-user-info.service';
import { ShippingAddressDto, UpdateProfileDto } from './profiles.dto';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(MemberProfile.name)
    private readonly profileModel: Model<MemberProfileDocument>,
  ) {}

  async getOrCreate(auth0Sub: string, identity?: Auth0Identity) {
    const authEmail = identity?.email.trim().toLowerCase();
    const update = {
      $setOnInsert: {
        auth0Sub,
        ...(authEmail ? { email: authEmail } : {}),
      },
      ...(authEmail
        ? {
            $set: {
              authEmail,
              authEmailVerified: identity?.emailVerified === true,
            },
          }
        : {}),
    };

    return this.profileModel
      .findOneAndUpdate({ auth0Sub }, update, {
        returnDocument: 'after',
        upsert: true,
        setDefaultsOnInsert: true,
      })
      .lean()
      .exec();
  }

  async getDocument(auth0Sub: string) {
    return this.profileModel
      .findOneAndUpdate(
        { auth0Sub },
        { $setOnInsert: { auth0Sub } },
        {
          returnDocument: 'after',
          upsert: true,
          setDefaultsOnInsert: true,
        },
      )
      .exec();
  }

  async update(auth0Sub: string, input: UpdateProfileDto) {
    return this.profileModel
      .findOneAndUpdate(
        { auth0Sub },
        {
          $set: {
            preferredName: input.preferredName.trim(),
            email: input.email.trim().toLowerCase(),
            membershipType: input.membershipType,
            contactMethod: input.contactMethod,
            contactHandle: input.contactHandle.trim(),
            beliefsSummary: input.beliefsSummary.trim(),
          },
        },
        {
          returnDocument: 'after',
          upsert: true,
          setDefaultsOnInsert: true,
        },
      )
      .lean()
      .exec();
  }

  async updateShipping(auth0Sub: string, input: ShippingAddressDto) {
    return this.profileModel
      .findOneAndUpdate(
        { auth0Sub },
        {
          $set: {
            shippingAddress: {
              ...input,
              recipientName: input.recipientName.trim(),
              line1: input.line1.trim(),
              line2: input.line2?.trim() || undefined,
              city: input.city.trim(),
              state: input.state.toUpperCase(),
              postalCode: input.postalCode.trim(),
              phone: input.phone?.trim() || undefined,
              country: 'US',
            },
          },
        },
        {
          returnDocument: 'after',
          upsert: true,
          setDefaultsOnInsert: true,
        },
      )
      .lean()
      .exec();
  }

  async deleteShipping(auth0Sub: string) {
    return this.profileModel
      .findOneAndUpdate(
        { auth0Sub },
        { $unset: { shippingAddress: 1 } },
        {
          returnDocument: 'after',
          upsert: true,
          setDefaultsOnInsert: true,
        },
      )
      .lean()
      .exec();
  }
}
