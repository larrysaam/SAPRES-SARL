import httpStatus from 'http-status';
import { ApiError } from '../utils/ApiError.js';

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated'));
  }

  if (!roles.includes(req.user.role)) {
    return next(new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to perform this action'));
  }

  next();
};

export default authorize;