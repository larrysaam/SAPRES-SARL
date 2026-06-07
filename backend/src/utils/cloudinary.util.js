import { v2 as cloudinary } from 'cloudinary';
import config from '../config/env.js';

cloudinary.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret,
  secure: true,
});

// Helper function to delete file from Cloudinary
const deleteFileFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!publicId) return null;
  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
};

export { deleteFileFromCloudinary };
