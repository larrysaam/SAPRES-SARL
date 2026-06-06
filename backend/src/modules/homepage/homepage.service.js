const Homepage = require('./homepage.model');
const ApiError = require('../../utils/ApiError');
const cloudinary = require('../../config/cloudinary');
const httpStatus = require('http-status');

/**
 * Get homepage content
 * @returns {Promise<Homepage>}
 */
const getHomepage = async () => {
  let homepage = await Homepage.findOne();
  if (!homepage) {
    homepage = await Homepage.create({}); // Create a default homepage document if none exists
  }
  return homepage;
};

/**
 * Update homepage content
 * @param {Object} updateBody
 * @returns {Promise<Homepage>}
 */
const updateHomepage = async (updateBody) => {
  const homepage = await getHomepage(); // Ensures a homepage document exists
  Object.assign(homepage, updateBody);
  await homepage.save();
  return homepage;
};

/**
 * Upload hero image
 * @param {Object} file
 * @returns {Promise<Homepage>}
 */
const uploadHeroImage = async (file) => {
  const homepage = await getHomepage();

  if (homepage.hero.backgroundImage && homepage.hero.backgroundImage.publicId) {
    await cloudinary.uploader.destroy(homepage.hero.backgroundImage.publicId);
  }

  const result = await cloudinary.uploader.upload(file.path, {
    folder: 'sapres/homepage',
    public_id: 'hero-banner',
    resource_type: 'image',
  });

  homepage.hero.backgroundImage = {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    format: result.format,
    bytes: result.bytes,
  };
  await homepage.save();
  return homepage;
};

/**
 * Upload hero video
 * @param {Object} file
 * @returns {Promise<Homepage>}
 */
const uploadHeroVideo = async (file) => {
  const homepage = await getHomepage();

  if (homepage.hero.backgroundVideo && homepage.hero.backgroundVideo.publicId) {
    await cloudinary.uploader.destroy(homepage.hero.backgroundVideo.publicId, {
      resource_type: 'video',
    });
  }

  const result = await cloudinary.uploader.upload(file.path, {
    folder: 'sapres/homepage',
    public_id: 'hero-video',
    resource_type: 'video',
  });

  homepage.hero.backgroundVideo = {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    format: result.format,
    bytes: result.bytes,
  };
  await homepage.save();
  return homepage;
};

module.exports = {
  getHomepage,
  updateHomepage,
  uploadHeroImage,
  uploadHeroVideo,
};