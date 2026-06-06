import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware for single file upload
const uploadSingle = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (err) => {
    if (err) {
      return next(new ApiError(400, err.message));
    }
    next();
  });
};

// Middleware for multiple files with different field names (e.g., upload.fields)
const uploadFields = (fields) => (req, res, next) => {
  upload.fields(fields)(req, res, (err) => {
    if (err) {
      return next(new ApiError(400, err.message));
    }
    next();
  });
};

// Middleware for multiple files with same field name (e.g., upload.array)
const uploadArray = (fieldName, maxCount) => (req, res, next) => {
  upload.array(fieldName, maxCount)(req, res, (err) => {
    if (err) {
      return next(new ApiError(400, err.message));
    }
    next();
  });
};

export { uploadArray, uploadSingle, uploadFields };
export default { uploadArray, uploadSingle, uploadFields };
