const mongoose = require('mongoose');
const { assetSchema } = require('../../schemas/asset.schema');
const { slugify } = require('../../utils/slugify');

const categoryStatus = ['active', 'inactive'];

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    shortDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },
    image: {
      type: assetSchema,
      default: null,
    },
    icon: {
      type: assetSchema,
      default: null,
    },
    productCount: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: categoryStatus,
      default: 'active',
    },
    seoTitle: {
      type: String,
      trim: true,
      maxlength: 70,
    },
    seoDescription: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    seoKeywords: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 20;
        },
        message: 'A category can have a maximum of 20 SEO keywords',
      },
    },
    createdBy: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      firstName: String,
      lastName: String,
    },
  },
  { timestamps: true }
);

categorySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name);
  }
  next();
});

/**
 * Check if category name is taken
 * @param {string} name - The category's name
 * @param {ObjectId} [excludeCategoryId] - The id of the category to be excluded
 * @returns {Promise<boolean>}
 */
categorySchema.statics.isNameTaken = async function (name, excludeCategoryId) {
  const category = await this.findOne({ name, _id: { $ne: excludeCategoryId } });
  return !!category;
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
