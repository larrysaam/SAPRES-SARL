import Project from './project.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import cloudinary from '../../config/cloudinary.js';
import {slugify} from '../../utils/slugify.js';

// Helper function to delete image from Cloudinary
const deleteImageFromCloudinary = async (publicId) => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
};

// Get all projects
const getAllProjects = async (query) => {
  const { page = 1, limit = 12, featured, category, status, search, sort } = query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (featured) filter.featured = featured === 'true';
  if (category) filter.projectCategory = category;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { shortDescription: { $regex: search, $options: 'i' } },
      { 'client.name': { $regex: search, $options: 'i' } },
    ];
  }

  let sortOptions = {};
  if (sort === 'newest') sortOptions.createdAt = -1;
  if (sort === 'oldest') sortOptions.createdAt = 1;
  if (sort === 'displayOrder') sortOptions.displayOrder = 1;

  const projects = await Project.find(filter)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit)
    .select('title slug shortDescription projectCategory capacity completionDate featured featuredImage');

  const total = await Project.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);

  return new ApiResponse(200, {
    projects,
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages,
  }, 'Projects retrieved successfully');
};

// Get single project by slug
const getSingleProject = async (slug) => {
  const project = await Project.findOne({ slug });
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  return new ApiResponse(200, project, 'Project retrieved successfully');
};

// Create a new project
const createProject = async (projectData) => {
  const newProject = new Project({
    title: projectData.title,
    shortDescription: projectData.shortDescription,
    description: projectData.description,
    client: projectData.client,
    projectCategory: projectData.projectCategory,
    projectType: projectData.projectType,
    capacity: projectData.capacity,
    duration: projectData.duration,
    completionDate: projectData.completionDate,
    featuredImage: projectData.featuredImage,
    gallery: projectData.gallery || [],
    beforeImages: projectData.beforeImages || [],
    afterImages: projectData.afterImages || [],
    technologiesUsed: projectData.technologiesUsed,
    projectChallenges: projectData.projectChallenges,
    projectSolutions: projectData.projectSolutions,
    projectResults: projectData.projectResults,
    testimonial: projectData.testimonial,
    featured: projectData.featured || false,
    status: projectData.status || 'draft',
    displayOrder: projectData.displayOrder || 0,
    seoTitle: projectData.seoTitle,
    seoDescription: projectData.seoDescription,
    createdBy: "admin",
  });
  await newProject.save();
  return new ApiResponse(201, {
    _id: newProject._id,
    title: newProject.title,
    slug: newProject.slug,
  }, 'Project created successfully');
};

// Update project
const updateProject = async (projectId, updateData) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // If title is updated, regenerate slug
  if (updateData.title && updateData.title !== project.title) {
    updateData.slug = slugify(updateData.title);
  }

  // Update all fields explicitly
  if (updateData.title !== undefined) project.title = updateData.title;
  if (updateData.shortDescription !== undefined) project.shortDescription = updateData.shortDescription;
  if (updateData.description !== undefined) project.description = updateData.description;
  if (updateData.client !== undefined) project.client = updateData.client;
  if (updateData.projectCategory !== undefined) project.projectCategory = updateData.projectCategory;
  if (updateData.projectType !== undefined) project.projectType = updateData.projectType;
  if (updateData.capacity !== undefined) project.capacity = updateData.capacity;
  if (updateData.duration !== undefined) project.duration = updateData.duration;
  if (updateData.completionDate !== undefined) project.completionDate = updateData.completionDate;
  if (updateData.featuredImage !== undefined) project.featuredImage = updateData.featuredImage;
  if (updateData.gallery !== undefined) project.gallery = updateData.gallery;
  if (updateData.beforeImages !== undefined) project.beforeImages = updateData.beforeImages;
  if (updateData.afterImages !== undefined) project.afterImages = updateData.afterImages;
  if (updateData.technologiesUsed !== undefined) project.technologiesUsed = updateData.technologiesUsed;
  if (updateData.projectChallenges !== undefined) project.projectChallenges = updateData.projectChallenges;
  if (updateData.projectSolutions !== undefined) project.projectSolutions = updateData.projectSolutions;
  if (updateData.projectResults !== undefined) project.projectResults = updateData.projectResults;
  if (updateData.testimonial !== undefined) project.testimonial = updateData.testimonial;
  if (updateData.featured !== undefined) project.featured = updateData.featured;
  if (updateData.status !== undefined) project.status = updateData.status;
  if (updateData.displayOrder !== undefined) project.displayOrder = updateData.displayOrder;
  if (updateData.seoTitle !== undefined) project.seoTitle = updateData.seoTitle;
  if (updateData.seoDescription !== undefined) project.seoDescription = updateData.seoDescription;

  await project.save();
  return new ApiResponse(200, null, 'Project updated successfully');
};

// Soft delete project
const deleteProject = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  await project.softDelete();
  return new ApiResponse(200, null, 'Project deleted successfully');
};

// Upload featured image
const uploadFeaturedImage = async (projectId, imageData) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Delete old featured image if exists
  if (project.featuredImage && project.featuredImage.publicId) {
    await deleteImageFromCloudinary(project.featuredImage.publicId);
  }

  project.featuredImage = { publicId: imageData.public_id, secureUrl: imageData.secure_url };
  await project.save();

  return new ApiResponse(200, project.featuredImage, "Featured image uploaded successfully");
};

// Upload gallery images
const uploadGalleryImages = async (projectId, imagesData) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const newImages = imagesData.map(image => ({
    publicId: image.public_id,
    secureUrl: image.secure_url,
  }));

  project.gallery.push(...newImages);
  await project.save();

  return new ApiResponse(200, null, "Gallery images uploaded successfully");
};

// Upload before images
const uploadBeforeImages = async (projectId, imagesData) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const newImages = imagesData.map(image => ({
    publicId: image.public_id,
    secureUrl: image.secure_url,
  }));

  project.beforeImages.push(...newImages);
  await project.save();

  return new ApiResponse(200, null, "Before images uploaded successfully");
};

// Upload after images
const uploadAfterImages = async (projectId, imagesData) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const newImages = imagesData.map(image => ({
    publicId: image.public_id,
    secureUrl: image.secure_url,
  }));

  project.afterImages.push(...newImages);
  await project.save();

  return new ApiResponse(200, null, "After images uploaded successfully");
};

// Delete project image
const deleteProjectImage = async (projectId, imageId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  let imageFound = false;

  // Check featured image
  if (project.featuredImage && project.featuredImage.publicId === imageId) {
    await deleteImageFromCloudinary(project.featuredImage.publicId);
    project.featuredImage = undefined;
    imageFound = true;
  } else {
    // Check gallery, before, and after images
    const imageArrays = [project.gallery, project.beforeImages, project.afterImages];
    for (const arr of imageArrays) {
      const initialLength = arr.length;
      arr.pull({ publicId: imageId }); // Mongoose method to remove subdocument
      if (arr.length < initialLength) {
        await deleteImageFromCloudinary(imageId);
        imageFound = true;
        break;
      }
    }
  }

  if (!imageFound) {
    throw new ApiError(404, 'Image not found in project');
  }

  await project.save();
  return new ApiResponse(200, null, 'Image deleted successfully');
};

// Get featured projects
const getFeaturedProjects = async () => {
  const projects = await Project.find({ featured: true, status: 'published' })
    .sort({ displayOrder: 1, createdAt: -1 })
    .select('title slug featuredImage');

  return new ApiResponse(200, projects, 'Featured projects retrieved successfully');
};

// Get project statistics (placeholder for now, will implement caching later)
const getProjectStatistics = async () => {
  const totalProjects = await Project.countDocuments({ status: 'published' });
  const industrialProjects = await Project.countDocuments({ projectCategory: 'Industrial', status: 'published' });
  const residentialProjects = await Project.countDocuments({ projectCategory: 'Residential', status: 'published' });
  const commercialProjects = await Project.countDocuments({ projectCategory: 'Commercial', status: 'published' });

  // Placeholder for totalInstalledCapacity - would require more complex aggregation
  const totalInstalledCapacity = '8.5MW';

  return new ApiResponse(200, {
    totalProjects,
    industrialProjects,
    residentialProjects,
    commercialProjects,
    totalInstalledCapacity,
  }, 'Project statistics retrieved successfully');
};

// Reorder projects
const reorderProjects = async (projectsToReorder) => {
  const bulkOperations = projectsToReorder.map(project => ({
    updateOne: {
      filter: { _id: project.id },
      update: { displayOrder: project.displayOrder },
    },
  }));

  await Project.bulkWrite(bulkOperations);
  return new ApiResponse(200, null, 'Project order updated successfully');
};


export default {
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