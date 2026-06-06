const httpStatus = require('http-status');
const { homepageService } = require('../services');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');

const getHomepageController = async (req, res, next) => {
  try {
    const homepage = await homepageService.getHomepage();
    res
      .status(httpStatus.OK)
      .send(new ApiResponse(httpStatus.OK, 'Homepage retrieved successfully', homepage));
  } catch (error) {
    next(error);
  }
};

const updateHomepageController = async (req, res, next) => {
  try {
    const homepage = await homepageService.updateHomepage(req.body);
    res
      .status(httpStatus.OK)
      .send(new ApiResponse(httpStatus.OK, 'Homepage updated successfully', homepage));
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
        new ApiResponse(httpStatus.OK, 'Hero image uploaded successfully', {
          backgroundImage: homepage.hero.backgroundImage,
        })
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
        new ApiResponse(httpStatus.OK, 'Hero video uploaded successfully', {
          backgroundVideo: homepage.hero.backgroundVideo,
        })
      );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHomepageController,
  updateHomepageController,
  uploadHeroImageController,
  uploadHeroVideoController,
};
