import httpStatus from 'http-status';
import User from './auth.model.js';
import { ApiError } from '../../utils/ApiError.js';
import config from '../../config/env.js';
import jwt from 'jsonwebtoken';

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid email or password');
  }
  if (!user.isActive) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Account is inactive. Please contact support.');
  }
  await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
  return user;
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshAuthTokens = async (refreshToken) => {
  try {
    const payload = jwt.verify(refreshToken, config.jwt.secret);
    const user = await User.findById(payload._id);
    if (!user) {
      throw new Error();
    }
    const newAccessToken = user.generateAccessToken();
    return { accessToken: newAccessToken };
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token');
  }
};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise}
 */
const logout = async (refreshToken) => {
  // In a real application, you would invalidate the refresh token in a database
  // For this example, we'll just assume the client discards it.
  // If refresh tokens are stored in the DB, find and delete it here.
  try {
    const payload = jwt.verify(refreshToken, config.jwt.secret);
    const user = await User.findById(payload._id);
    if (!user) {
      throw new Error();
    }
    // Here you would typically remove the refresh token from a database if you were storing them
    // For now, we'll just return success.
    return;
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token');
  }
};

/**
 * Change user password
 * @param {ObjectId} userId
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<User>}
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (!(await user.isPasswordMatch(currentPassword))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect current password');
  }
  user.password = newPassword; // Pre-save hook will hash it
  await user.save();
  return user;
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise}
 */
const resetPassword = async (resetPasswordToken, newPassword) => {
  try {
    const payload = jwt.verify(resetPasswordToken, config.jwt.secret);
    const user = await User.findById(payload._id);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    user.password = newPassword;
    await user.save();
    // Invalidate the reset token if stored in DB
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed');
  }
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateResetPasswordToken = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No user found with that email');
  }
  const resetPasswordToken = jwt.sign({ _id: user._id }, config.jwt.secret, {
    expiresIn: config.jwt.resetPasswordExpirationMinutes * 60,
  });
  // In a real application, you would save this token to the user in the database
  // and send it via email. For now, we'll just return it.
  return resetPasswordToken;
};

export default {
  loginUserWithEmailAndPassword,
  refreshAuthTokens,
  logout,
  changePassword,
  resetPassword,
  generateResetPasswordToken,
};
