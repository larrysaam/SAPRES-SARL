import httpStatus from 'http-status';
import homepageService from './homepage.service.js'; // Assuming homepage.service.js exists and is ESM
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

const getHomepageController = async (req, res, next) => {
  try {
    const homepage = await homepageService.getHomepage();
    res
      .status(httpStatus.OK)
      .send(new ApiResponse(httpStatus.OK, homepage, 'Homepage retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

const updateHomepageController = async (req, res, next) => {
  try {
    const homepage = await homepageService.updateHomepage(req.body);
    res
      .status(httpStatus.OK)
      .send(new ApiResponse(httpStatus.OK, homepage, 'Homepage updated successfully'));
  } catch (error) {
    next(error);
  }
};

const uploadHeroImageController = async (req, res, next) => {
  try {
    const { secure_url, public_id, format, bytes } = req.body;
    if (!secure_url || !public_id) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Image data { secure_url, public_id } is required');
    }
    const homepage = await homepageService.uploadHeroImage({ secureUrl: secure_url, publicId: public_id, format, bytes });
    res
      .status(httpStatus.OK)
      .send(
        new ApiResponse(httpStatus.OK, { backgroundImage: homepage.hero.backgroundImage }, 'Hero image uploaded successfully')
      );
  } catch (error) {
    next(error);
  }
};

const uploadHeroVideoController = async (req, res, next) => {
  try {
    const { secure_url, public_id, format, bytes } = req.body;
    if (!secure_url || !public_id) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Video data { secure_url, public_id } is required');
    }
    const homepage = await homepageService.uploadHeroVideo({ secureUrl: secure_url, publicId: public_id, format, bytes });
    res
      .status(httpStatus.OK)
      .send(
        new ApiResponse(httpStatus.OK, { backgroundVideo: homepage.hero.backgroundVideo }, 'Hero video uploaded successfully')
      );
  } catch (error) {
    next(error);
  }
};

export default {
  getHomepageController,
  updateHomepageController,
  uploadHeroImageController,
  uploadHeroVideoController,
};
