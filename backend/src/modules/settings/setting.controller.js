import httpStatus from 'http-status';
import  settingService  from './setting.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

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

export default {
  getSettingsController,
  updateSettingsController,
  uploadLogoController,
  uploadFaviconController,
};