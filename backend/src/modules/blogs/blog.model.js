const mongoose = require('mongoose');
const slugify = require('../../utils/slugify');

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true
    },

    excerpt: {
      type: String,
      required: true
    },

    content: {
      type: String,
      required: true
    },

    featuredImage: {
      publicId: String,
      secureUrl: String
    },

    gallery: [
      {
        publicId: String,
        secureUrl: String,
        _id: false
      }
    ],

    category: {
      type: String,
      enum: [
        "Solar Guides",
        "Company News",
        "Energy Tips",
        "Product Updates",
        "Installation Tips",
        "Success Stories",
        "Industry News"
      ],
      required: true
    },

    tags: [String],

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    readTime: {
      type: Number,
      default: 5
    },

    views: {
      type: Number,
      default: 0
    },

    featured: {
      type: Boolean,
      default: false
    },

    allowComments: {
      type: Boolean,
      default: false
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft"
    },

    publishedAt: Date,

    seoTitle: {
      type: String,
      required: true
    },

    seoDescription: {
      type: String,
      required: true
    },

    deletedAt: Date
  },
  {
    timestamps: true
  }
);

// Auto-generate slug from title before saving
blogSchema.pre('save', function (next) {
  if (!this.isModified('title')) return next();
  this.slug = slugify(this.title);
  next();
});

// Auto-calculate read time (approx 200 words per minute)
blogSchema.pre('save', function (next) {
  if (!this.isModified('content')) return next();
  const wordCount = this.content.split(/\s+/).length;
  this.readTime = Math.ceil(wordCount / 200);
  next();
});

// Set publishedAt when status changes to published
blogSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Exclude soft-deleted posts from queries
blogSchema.query.notDeleted = function () {
  return this.where({ deletedAt: { $exists: false } });
};

module.exports = mongoose.model('Blog', blogSchema);
