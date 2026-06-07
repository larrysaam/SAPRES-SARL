import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

import config from '../config/env.js';

cloudinary.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret,
  secure: true,
});

/**
 * Uploads a file to Cloudinary from a local file path.
 * @param {string} filePath - The path to the file to upload.
 * @param {string} folder - The Cloudinary folder to upload to (e.g., 'sapres/products/productId').
 * @param {string} resourceType - The type of resource ('image', 'video', 'raw').
 * @param {Array<string>} [tags=[]] - An array of tags to apply to the uploaded file.
 * @param {Object} [context={}] - An object of key-value pairs for context metadata.
 * @param {Object} [uploadOptions={}] - Additional Cloudinary upload options.
 * @returns {Promise<Object>} - A promise that resolves with the Cloudinary upload result.
 */
const uploadFile = async (filePath, folder, resourceType, tags = [], context = {}, uploadOptions = {}) => {
  try {
    const options = {
      folder,
      resource_type: resourceType,
      tags,
      context,
      ...uploadOptions,
    };

    // Specific handling for raw files like PDFs
    if (resourceType === 'raw') {
      options.raw_convert = 'aspose'; // Or 'google' depending on preference/plan
      options.format = 'pdf'; // Ensure format is set for raw PDF uploads
    }

    const result = await cloudinary.uploader.upload(filePath, options);
    return {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      resourceType: result.resource_type,
    };
  } catch (error) {
    console.error('Cloudinary upload error (filePath):', error);
    throw new Error('Failed to upload file to Cloudinary.');
  }
};

/**
 * Uploads a file buffer to Cloudinary.
 * @param {Buffer} buffer - The file buffer to upload.
 * @param {string} folder - The Cloudinary folder to upload to (e.g., 'sapres/products/productId').
 * @param {string} resourceType - The type of resource ('image', 'video', 'raw').
 * @param {Array<string>} [tags=[]] - An array of tags to apply to the uploaded file.
 * @param {Object} [context={}] - An object of key-value pairs for context metadata.
 * @param {Object} [uploadOptions={}] - Additional Cloudinary upload options.
 * @returns {Promise<Object>} - A promise that resolves with the Cloudinary upload result.
 */
const uploadBuffer = (buffer, folder, resourceType, tags = [], context = {}, uploadOptions = {}) => {
  return new Promise((resolve, reject) => {
    const options = {
      folder,
      resource_type: resourceType,
      tags,
      context,
      ...uploadOptions,
    };

    if (resourceType === 'raw') {
      options.raw_convert = 'aspose';
      options.format = 'pdf';
    }

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        console.error('Cloudinary upload error (buffer):', error);
        return reject(new Error('Failed to upload file buffer to Cloudinary.'));
      }
      resolve({
        publicId: result.public_id,
        secureUrl: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        resourceType: result.resource_type,
      });
    });
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Deletes a file from Cloudinary.
 * @param {string} publicId - The public ID of the file to delete.
 * @param {string} resourceType - The type of resource ('image', 'video', 'raw').
 * @returns {Promise<Object>} - A promise that resolves with the Cloudinary deletion result.
 */
const deleteFile = async (publicId, resourceType) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result;
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
    throw new Error('Failed to delete file from Cloudinary.');
  }
};

export { uploadFile, uploadBuffer, deleteFile, cloudinary };

