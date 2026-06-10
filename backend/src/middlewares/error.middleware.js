import { ApiError } from '../utils/ApiError.js';

const errorConverter = (err, req, res, next) => {
  let error = err;

  // Handle MongoDB duplicate key errors
  if (err.code === 11000 || err.code === 11001) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue?.[field] || '';
    const message = `Duplicate ${field}: "${value}". This ${field} is already taken.`;
    error = new ApiError(409, message, err.stack);
    return next(error);
  }

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Something went wrong';
    error = new ApiError(statusCode, message, err.stack);
  }
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  res.status(statusCode).send(response);
};

export { errorConverter, errorHandler };
