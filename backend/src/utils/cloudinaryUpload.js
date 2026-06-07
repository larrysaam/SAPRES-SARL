import { v2 as cloudinary } from 'cloudinary';
import { ApiError } from './ApiError.js';

// Configure Cloudinary (assuming it's already configured in config/cloudinary.js, but good to have here for direct usage)
// This configuration should ideally come from a central place or environment variables.
// For now, I'll assume `cloudinary` import from `config/cloudinary.js` is sufficient for the main app.
// If this utility is to be standalone, it would need its own config.
// For this task, I'll assume the main cloudinary config is loaded elsewhere and this utility just uses the `cloudinary` object.

// Helper function to upload image/file to Cloudinary
const uploadToCloudinary = async (fileBuffer, folder, originalname, resourceType = 'image') => {
  if (!fileBuffer) {
    throw new ApiError(400, 'File buffer is missing for Cloudinary upload.');
  }

  // Cloudinary expects a data URI or a stream/buffer.
  // We'll convert the buffer to a data URI for upload.
  const base64File = Buffer.from(fileBuffer).toString('base64');
  const dataUri = `data:${resourceType === 'image' ? 'image/jpeg' : 'application/octet-stream'};base64,${base64File}`;

  const options = {
    folder: `sapres/${folder}`,
    resource_type: resourceType,
    // Optional: public_id can be set based on originalname or a generated UUID
    // public_id: originalname ? `${folder}/${originalname.split('.')[0]}` : undefined,
  };

  try {
    const result = await cloudinary.uploader.upload(dataUri, options);
    return {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      originalName: originalname,
      resourceType: result.resource_type,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new ApiError(500, `Cloudinary upload failed: ${error.message}`);
  }
};

// Helper function to delete image/file from Cloudinary
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
    throw new ApiError(500, `Cloudinary deletion failed: ${error.message}`);
  }
};

export { uploadToCloudinary, deleteFromCloudinary };
