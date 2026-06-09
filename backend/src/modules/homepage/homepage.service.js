import Homepage from './homepage.model.js';
import { ApiError } from '../../utils/ApiError.js';
import cloudinary from '../../config/cloudinary.js';
import httpStatus from 'http-status';

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
 * Upload hero image - accepts pre-uploaded Cloudinary asset data
 * @param {Object} asset - { secureUrl, publicId, format, bytes }
 * @returns {Promise<Homepage>}
 */
const uploadHeroImage = async (asset) => {
  const homepage = await getHomepage();

  if (homepage.hero.backgroundImage && homepage.hero.backgroundImage.publicId) {
    try {
      await cloudinary.uploader.destroy(homepage.hero.backgroundImage.publicId);
    } catch (e) {
      // Ignore delete errors - old image may not exist
    }
  }

  homepage.hero.backgroundImage = {
    publicId: asset.publicId,
    secureUrl: asset.secureUrl,
    format: asset.format || 'jpg',
    bytes: asset.bytes || 0,
  };
  await homepage.save();
  return homepage;
};

/**
 * Upload hero video - accepts pre-uploaded Cloudinary asset data
 * @param {Object} asset - { secureUrl, publicId, format, bytes }
 * @returns {Promise<Homepage>}
 */
const uploadHeroVideo = async (asset) => {
  const homepage = await getHomepage();

  if (homepage.hero.backgroundVideo && homepage.hero.backgroundVideo.publicId) {
    try {
      await cloudinary.uploader.destroy(homepage.hero.backgroundVideo.publicId, {
        resource_type: 'video',
      });
    } catch (e) {
      // Ignore delete errors
    }
  }

  homepage.hero.backgroundVideo = {
    publicId: asset.publicId,
    secureUrl: asset.secureUrl,
    format: asset.format || 'mp4',
    bytes: asset.bytes || 0,
  };
  await homepage.save();
  return homepage;
};

export default {
  getHomepage,
  updateHomepage,
  uploadHeroImage,
  uploadHeroVideo,
};
