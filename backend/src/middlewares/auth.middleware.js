import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import { ApiError } from '../utils/ApiError.js';
import config from '../config/env.js';
import User from '../modules/auth/auth.model.js'; // Assuming User model is in auth module

const auth = () => async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(decoded._id);

    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
    }

    req.user = user;
    next();
  } catch (err) {
    next(new ApiError(httpStatus.UNAUTHORIZED, 'Authentication failed'));
  }
};

export default auth;