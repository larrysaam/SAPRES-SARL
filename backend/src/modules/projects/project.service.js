const Project = require('./project.model');
const { ApiError } = require('../../utils/ApiError');
const { ApiResponse } = require('../../utils/ApiResponse');
const cloudinary = require('../../config/cloudinary');
const slugify = require('../../utils/slugify');

// Helper function to upload image to Cloudinary
const uploadImageToCloudinary = async (file, folder) => {
  if (!file) return null;

  const result = await cloudinary.uploader.upload(file.path, {
    folder: `sapres/projects/${folder}`,
  });
  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
  };
};

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
const createProject = async (projectData, userId) => {
  const newProject = new Project({
    ...projectData,
    createdBy: userId,
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

  Object.assign(project, updateData);
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
const uploadFeaturedImage = async (projectId, file) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // Delete old featured image if exists
  if (project.featuredImage && project.featuredImage.publicId) {
    await deleteImageFromCloudinary(project.featuredImage.publicId);
  }

  const uploadedImage = await uploadImageToCloudinary(file, `${projectId}/featured`);
  project.featuredImage = uploadedImage;
  await project.save();

  return new ApiResponse(200, uploadedImage, 'Featured image uploaded successfully');
};

// Upload gallery images
const uploadGalleryImages = async (projectId, files) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  const uploadedImages = await Promise.all(
    files.map((file) => uploadImageToCloudinary(file, `${projectId}/gallery`))
  );
  project.gallery.push(...uploadedImages);
  await project.save();

  return new ApiResponse(200, null, 'Gallery images uploaded successfully');
};

// Upload before images
const uploadBeforeImages = async (projectId, files) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  const uploadedImages = await Promise.all(
    files.map((file) => uploadImageToCloudinary(file, `${projectId}/before`))
  );
  project.beforeImages.push(...uploadedImages);
  await project.save();

  return new ApiResponse(200, null, 'Before images uploaded successfully');
};

// Upload after images
const uploadAfterImages = async (projectId, files) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  const uploadedImages = await Promise.all(
    files.map((file) => uploadImageToCloudinary(file, `${projectId}/after`))
  );
  project.afterImages.push(...uploadedImages);
  await project.save();

  return new ApiResponse(200, null, 'After images uploaded successfully');
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


module.exports = {
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