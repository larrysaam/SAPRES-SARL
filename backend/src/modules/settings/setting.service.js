const Setting = require('./setting.model');
const ApiError = require('../../utils/ApiError');
const cloudinary = require('../../config/cloudinary');
const httpStatus = require('http-status');

/**
 * Get settings
 * @returns {Promise<Setting>}
 */
const getSettings = async () => {
  let settings = await Setting.findOne();
  if (!settings) {
    settings = await Setting.create({}); // Create a default settings document if none exists
  }
  return settings;
};

/**
 * Update settings by id
 * @param {Object} updateBody
 * @returns {Promise<Setting>}
 */
const updateSettings = async (updateBody) => {
  const settings = await getSettings(); // Ensures a settings document exists
  Object.assign(settings, updateBody);
  await settings.save();
  return settings;
};

/**
 * Upload company logo
 * @param {Object} file
 * @returns {Promise<Setting>}
 */
const uploadLogo = async (file) => {
  const settings = await getSettings();

  if (settings.logo && settings.logo.publicId) {
    await cloudinary.uploader.destroy(settings.logo.publicId);
  }

  const result = await cloudinary.uploader.upload(file.path, {
    folder: 'sapres/settings',
    public_id: 'logo',
    resource_type: 'image',
  });

  settings.logo = {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    format: result.format,
    bytes: result.bytes,
  };
  await settings.save();
  return settings;
};

/**
 * Upload favicon
 * @param {Object} file
 * @returns {Promise<Setting>}
 */
const uploadFavicon = async (file) => {
  const settings = await getSettings();

  if (settings.favicon && settings.favicon.publicId) {
    await cloudinary.uploader.destroy(settings.favicon.publicId);
  }

  const result = await cloudinary.uploader.upload(file.path, {
    folder: 'sapres/settings',
    public_id: 'favicon',
    resource_type: 'image',
  });

  settings.favicon = {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    format: result.format,
    bytes: result.bytes,
  };
  await settings.save();
  return settings;
};

module.exports = {
  getSettings,
  updateSettings,
  uploadLogo,
  uploadFavicon,
};
