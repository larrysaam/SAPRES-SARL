const mongoose = require('mongoose');
const { assetSchema } = require('../../schemas/asset.schema');

const workingHoursSchema = new mongoose.Schema(
  {
    monday: { type: String, default: 'Closed' },
    tuesday: { type: String, default: 'Closed' },
    wednesday: { type: String, default: 'Closed' },
    thursday: { type: String, default: 'Closed' },
    friday: { type: String, default: 'Closed' },
    saturday: { type: String, default: 'Closed' },
    sunday: { type: String, default: 'Closed' },
  },
  { _id: false }
);

const socialLinksSchema = new mongoose.Schema(
  {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    youtube: { type: String, default: '' },
    twitter: { type: String, default: '' },
    tiktok: { type: String, default: '' },
  },
  { _id: false }
);

const settingSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
      default: 'SAPRES SARL',
    },
    companyDescription: {
      type: String,
      required: true,
      trim: true,
      default: 'Leading solar energy solutions provider in Cameroon.',
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      default: 'contact@sapres.cm',
    },
    phone: { type: String, required: true, trim: true, default: '+237677000000' },
    secondaryPhone: { type: String, trim: true, default: '' },
    whatsapp: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: 'Yaounde, Cameroon' },
    googleMapsUrl: { type: String, trim: true, default: '' },
    workingHours: { type: workingHoursSchema, default: {} },
    socialLinks: { type: socialLinksSchema, default: {} },
    logo: { type: assetSchema, default: null },
    favicon: { type: assetSchema, default: null },
    seoDefaultTitle: {
      type: String,
      trim: true,
      default: 'SAPRES SARL - Solar Energy Solutions',
    },
    seoDefaultDescription: {
      type: String,
      trim: true,
      default:
        'Solar installation, batteries, inverters, solar panels and renewable energy solutions.',
    },
    seoKeywords: { type: [String], default: [] },
  },
  { timestamps: true }
);

const Setting = mongoose.model('Setting', settingSchema);

module.exports = Setting;