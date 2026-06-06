const httpStatus = require('http-status');
const { settingService } = require('../services');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');

const getSettingsController = async (req, res, next) => {
  try {
    const settings = await settingService.getSettings();
    res
      .status(httpStatus.OK)
      .send(new ApiResponse(httpStatus.OK, 'Settings retrieved successfully', settings));
  } catch (error) {
    next(error);
  }
};

const updateSettingsController = async (req, res, next) => {
  try {
    const settings = await settingService.updateSettings(req.body);
    res
      .status(httpStatus.OK)
      .send(new ApiResponse(httpStatus.OK, 'Settings updated successfully', settings));
  } catch (error) {
    next(error);
  }
};

const uploadLogoController = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Logo file is required');
    }
    const settings = await settingService.uploadLogo(req.file);
    res
      .status(httpStatus.OK)
      .send(new ApiResponse(httpStatus.OK, 'Logo uploaded successfully', { logo: settings.logo }));
  } catch (error) {
    next(error);
  }
};

const uploadFaviconController = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Favicon file is required');
    }
    const settings = await settingService.uploadFavicon(req.file);
    res
      .status(httpStatus.OK)
      .send(
        new ApiResponse(httpStatus.OK, 'Favicon uploaded successfully', { favicon: settings.favicon })
      );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettingsController,
  updateSettingsController,
  uploadLogoController,
  uploadFaviconController,
};