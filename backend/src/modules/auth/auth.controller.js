import httpStatus from 'http-status';
import authService from './auth.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = user.generateAuthTokens();
  res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, { user, ...tokens }, 'Login successful'));
};

const refreshTokens = async (req, res) => {
  const { refreshToken } = req.body;
  const tokens = await authService.refreshAuthTokens(refreshToken);
  res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, { accessToken: tokens.accessToken }, 'Token refreshed successfully'));
};

const logout = async (req, res) => {
  const { refreshToken } = req.body;
  await authService.logout(refreshToken);
  res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, null, 'Logout successful'));
};

const me = async (req, res) => {
  // User is attached to req by auth middleware
  res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, req.user, 'Current user retrieved successfully'));
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user._id, currentPassword, newPassword);
  res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, null, 'Password changed successfully'));
};

const forgotPassword = async (req, res) => {
  const resetToken = await authService.generateResetPasswordToken(req.body.email);
  // In a real app, send this token via email
  res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, { resetToken }, 'Password reset link sent successfully'));
};

const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  await authService.resetPassword(token, password);
  res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, null, 'Password reset successfully'));
};

export default {
  login,
  refreshTokens,
  logout,
  me,
  changePassword,
  forgotPassword,
  resetPassword,
};
