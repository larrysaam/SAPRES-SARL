import mongoose from 'mongoose';
import { assetSchema } from '../../schemas/asset.schema.js';
import  {slugify}  from '../../utils/slugify.js';

const productStatus = ['draft', 'published', 'archived'];
const productCurrency = ['XAF', 'USD', 'EUR'];

const specificationSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    shortDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
      name: { type: String, required: true },
      slug: { type: String, required: true },
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPrice: {
      type: Number,
      min: 0,
      validate: {
        validator: function (v) {
          return !v || v < this.price;
        },
        message: 'Discount price must be less than the regular price',
      },
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: productCurrency,
      default: 'XAF',
    },
    warranty: {
      type: String,
      trim: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: productStatus,
      default: 'draft',
    },
    specifications: {
      type: [specificationSchema],
      default: [],
    },
    images: {
      type: [assetSchema],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 10;
        },
        message: 'A product can have a maximum of 10 images',
      },
    },
    datasheets: {
      type: [assetSchema],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 1;
        },
        message: 'A product can have a maximum of 1 datasheet',
      },
    },
    seoTitle: {
      type: String,
      trim: true,
    },
    seoDescription: {
      type: String,
      trim: true,
    },
    createdBy: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      firstName: String,
      lastName: String,
    },
  },
  { timestamps: true }
);

productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name);
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

export default Product;
