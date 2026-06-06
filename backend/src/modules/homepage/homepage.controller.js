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
    if (!req.file) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Hero image file is required');
    }
    const homepage = await homepageService.uploadHeroImage(req.file);
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
    if (!req.file) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Hero video file is required');
    }
    const homepage = await homepageService.uploadHeroVideo(req.file);
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
