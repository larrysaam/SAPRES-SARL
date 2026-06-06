import mongoose from 'mongoose';
import { assetSchema } from '../../schemas/asset.schema.js';

const statisticSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const featuredProductSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    image: { type: assetSchema, required: true },
  },
  { _id: false }
);

const featuredProjectSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    coverImage: { type: assetSchema, required: true },
  },
  { _id: false }
);

const featuredServiceSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const homepageSchema = new mongoose.Schema(
  {
    hero: {
      title: { type: String, default: 'Reliable Solar Energy Solutions' },
      subtitle: { type: String, default: 'Powering Homes and Businesses Across Cameroon' },
      ctaText: { type: String, default: 'Request a Quote' },
      ctaLink: { type: String, default: '/quote' },
      backgroundImage: { type: assetSchema, default: null },
      backgroundVideo: { type: assetSchema, default: null },
    },
    statistics: { type: [statisticSchema], default: [] },
    aboutSection: {
      title: { type: String, default: 'About SAPRES SARL' },
      description: { type: String, default: 'Company overview text.' },
      image: { type: assetSchema, default: null },
    },
    featuredProducts: { type: [featuredProductSchema], default: [] },
    featuredProjects: { type: [featuredProjectSchema], default: [] },
    featuredServices: { type: [featuredServiceSchema], default: [] },
    testimonials: {
      type: [
        {
          _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Testimonial', required: true },
          name: { type: String, required: true },
          testimonial: { type: String, required: true },
        },
      ],
      default: [],
    },
    partners: {
      type: [
        {
          name: { type: String, required: true },
          website: { type: String },
          logo: { type: assetSchema },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const Homepage = mongoose.model('Homepage', homepageSchema);

export default Homepage;
