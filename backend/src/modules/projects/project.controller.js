import projectService from './project.service.js';
import { createProjectSchema, updateProjectSchema, reorderProjectsSchema } from './project.validation.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

// Helper function for validation
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return next(new ApiError(400, error.details[0].message));
  }
  next();
};

// Get all projects
const getAllProjects = async (req, res, next) => {
  try {
    const response = await projectService.getAllProjects(req.query);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

// Get single project by slug
const getSingleProject = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const response = await projectService.getSingleProject(slug);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

// Create a new project
const createProject = async (req, res, next) => {
  try {
    console.log("Request body:", req.body);
    const userId = req.user._id; // Assuming user ID is available from auth middleware
    const response = await projectService.createProject(req.body, userId);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

// Update project
const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const response = await projectService.updateProject(id, req.body);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

// Delete project (soft delete)
const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const response = await projectService.deleteProject(id);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

// Upload featured image
const uploadFeaturedImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { secure_url, public_id } = req.body;
    if (!secure_url || !public_id) {
      throw new ApiError(400, "Missing secure_url or public_id");
    }
    const response = await projectService.uploadFeaturedImage(id, { secure_url, public_id });
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

// Upload gallery images
const uploadGalleryImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const images = req.body.images; // Assuming req.body.images is an array of { secure_url, public_id }
    if (!images || images.length === 0) {
      throw new ApiError(400, "No images provided");
    }
    const response = await projectService.uploadGalleryImages(id, images);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

// Upload before images
const uploadBeforeImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const images = req.body.images; // Assuming req.body.images is an array of { secure_url, public_id }
    if (!images || images.length === 0) {
      throw new ApiError(400, "No images provided");
    }
    const response = await projectService.uploadBeforeImages(id, images);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

// Upload after images
const uploadAfterImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const images = req.body.images; // Assuming req.body.images is an array of { secure_url, public_id }
    if (!images || images.length === 0) {
      throw new ApiError(400, "No images provided");
    }
    const response = await projectService.uploadAfterImages(id, images);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

// Delete project image
const deleteProjectImage = async (req, res, next) => {
  try {
    const { id, imageId } = req.params;
    const response = await projectService.deleteProjectImage(id, imageId);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

// Get featured projects
const getFeaturedProjects = async (req, res, next) => {
  try {
    const response = await projectService.getFeaturedProjects();
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

// Get project statistics
const getProjectStatistics = async (req, res, next) => {
  try {
    const response = await projectService.getProjectStatistics();
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

// Reorder projects
const reorderProjects = async (req, res, next) => {
  try {
    const response = await projectService.reorderProjects(req.body.projects);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

export default {
  validate,
  createProjectSchema,
  updateProjectSchema,
  reorderProjectsSchema,
  getAllProjects,
  getSingleProject,
  createProject,
  updateProject,
  deleteProject,
  uploadFeaturedImage,
  uploadGalleryImages,
  uploadBeforeImages,
  uploadAfterImages,
  deleteProjectImage,
  getFeaturedProjects,
  getProjectStatistics,
  reorderProjects,
};
