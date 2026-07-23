import {
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { INITIAL_PRODUCTS } from './catalog';
import {
  Product,
  ProductCategory,
  ProductDocument,
} from './schemas/product.schema';

@Injectable()
export class ProductsService implements OnApplicationBootstrap {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async onApplicationBootstrap() {
    await Promise.all(
      INITIAL_PRODUCTS.map((product) =>
        this.productModel
          .updateOne(
            { slug: product.slug },
            { $set: product },
            { upsert: true, setDefaultsOnInsert: true },
          )
          .exec(),
      ),
    );
  }

  async findAll(category?: ProductCategory) {
    const filter = category ? { category } : {};
    return this.productModel
      .find(filter)
      .sort({ category: 1, name: 1 })
      .lean()
      .exec();
  }

  async findBySlug(slug: string) {
    const product = await this.productModel.findOne({ slug }).lean().exec();
    if (!product) {
      throw new NotFoundException('That offering is not available.');
    }
    return product;
  }

  async findOrderableVariant(slug: string, variantId: string) {
    const product = await this.findBySlug(slug);
    if (product.availability === 'paused') {
      throw new NotFoundException('That offering is not currently orderable.');
    }
    const variant = product.variants.find((item) => item.id === variantId);
    if (!variant) {
      throw new NotFoundException('That offering option is not available.');
    }
    return { product, variant };
  }
}
