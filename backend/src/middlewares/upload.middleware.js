/**
 * Upload middleware
 *
 * Since the admin frontend uploads directly to Cloudinary and sends back
 * { secure_url, public_id, format, bytes } objects, this middleware is
 * simplified. Routes that previously expected file uploads now accept
 * JSON bodies with the asset data directly.
 *
 * For backward compatibility, multer is still available for direct
 * server-side uploads when needed.
 */

import multer from 'multer';
import config from '../config/env.js';

// Memory storage for buffer access
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * Upload single file - accepts multipart form data
 */
const uploadSingle = (fieldName) => upload.single(fieldName);

/**
 * Upload multiple files
 */
const uploadMultiple = (fieldName, maxCount) => upload.array(fieldName, maxCount || 10);

export { upload, uploadSingle, uploadMultiple };
