import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import DataTable from '../components/DataTable';
import type { Column } from '../components/DataTable';
import Modal from '../components/Modal';
import { CardSkeleton } from '../components/Skeleton';
import toast from '../components/Toast';
import blogService from '../services/blogService';
import type {
  Blog,
  Service,
  Project,
  Testimonial,
  Partner,
  HeroSection,
  Banner,
  Homepage,
} from '../types';

// ------------------------------------------------------------------
// Tabs
// ------------------------------------------------------------------
type Tab = 'homepage' | 'blog' | 'services' | 'projects' | 'testimonials' | 'partners';

const TABS: { key: Tab; label: string }[] = [
  { key: 'homepage', label: 'Homepage' },
  { key: 'blog', label: 'Blog' },
  { key: 'services', label: 'Services' },
  // { key: 'projects', label: 'Projects' },
  { key: 'testimonials', label: 'Testimonials' },
  // { key: 'partners', label: 'Partners' },
];

// ------------------------------------------------------------------
// Helper: rating stars
// ------------------------------------------------------------------
const RatingStars: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <svg
        key={i}
        className={`h-4 w-4 ${i <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
      </svg>
    ))}
  </div>
);

// ------------------------------------------------------------------
// ContentPage Component
// ------------------------------------------------------------------
const ContentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('homepage');
  const queryClient = useQueryClient();

  // ---------- Blog state ----------
  const [blogPage, setBlogPage] = useState(1);
  const [blogModalOpen, setBlogModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [blogDeleteId, setBlogDeleteId] = useState<string | null>(null);
  const [uploadingBlogCoverImage, setUploadingBlogCoverImage] = useState(false);
  const blogCoverImageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingBlogGallery, setUploadingBlogGallery] = useState(false);
  const blogGalleryInputRef = useRef<HTMLInputElement>(null);
  const [blogForm, setBlogForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    gallery: [] as string[],
    author: '',
    tags: '',
    category: 'Company News',
    seoTitle: '',
    seoDescription: '',
    status: 'draft' as 'draft' | 'published',
    featured: false,
  });

  // Cloudinary config
  const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your_cloud_name';
  const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'sapres_unsigned';

  
  /** Upload a single file to Cloudinary and return { secure_url, public_id } */
  const uploadToCloudinary = async (file: File, folder: string = 'sapres/services'): Promise<{ secure_url: string; public_id: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);

    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const res = await fetch(url, { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error?.message || `Upload failed (${res.status})`);
    }
    return res.json().then((d) => ({ secure_url: d.secure_url, public_id: d.public_id }));
  };

  // ---------- Service state ----------
  const [servicesModalOpen, setServicesModalOpen] = useState(false);
  const [uploadingServiceImage, setUploadingServiceImage] = useState(false);
  const serviceImageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingServiceGallery, setUploadingServiceGallery] = useState(false);
  const serviceGalleryInputRef = useRef<HTMLInputElement>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState({
    title: '',
    shortDescription: '',
    description: '',
    featuredImage: '',
    gallery: [] as string[],
    serviceFeatures: '',
    serviceBenefits: '',
    targetAudience: '',
    seoTitle: '',
    seoDescription: '',
    displayOrder: 0,
    status: 'draft' as 'draft' | 'published',
    featured: false,
  });

  // ---------- Project state ----------
  const [projectsModalOpen, setProjectsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const featuredImageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const beforeImagesInputRef = useRef<HTMLInputElement>(null);
  const afterImagesInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFeaturedImage, setUploadingFeaturedImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingBeforeImages, setUploadingBeforeImages] = useState(false);
  const [uploadingAfterImages, setUploadingAfterImages] = useState(false);
  const [projectForm, setProjectForm] = useState({
    title: '',
    slug: '',
    shortDescription: '',
    description: '',
    client: '',
    projectCategory: '',
    projectType: '',
    capacity: '',
    duration: '',
    completionDate: '',
    featuredImage: '', // secureUrl string
    gallery: [] as string[], // array of secureUrl strings
    beforeImages: [] as string[], // array of secureUrl strings
    afterImages: [] as string[], // array of secureUrl strings
    technologiesUsed: '', // comma separated string
    projectChallenges: '', // comma separated string
    projectSolutions: '', // comma separated string
    projectResults: '', // comma separated string
    featured: false,
    status: 'draft' as 'draft' | 'published' | 'archived',
    displayOrder: 0,
    seoTitle: '',
    seoDescription: '',
    isActive: true, // Kept from original, though not in schema, seems useful
  });

  // ---------- Testimonial state ----------
  const [testimonialsModalOpen, setTestimonialsModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [testimonialForm, setTestimonialForm] = useState({
    clientName: '',
    clientTitle: '',
    testimonialText: '',
    rating: 5,
    image: null as { secure_url: string; public_id: string } | null,
    featured: false,
    status: 'pending' as 'pending' | 'approved' | 'rejected',
  });
  const [uploadingTestimonialImage, setUploadingTestimonialImage] = useState(false);
  const testimonialImageInputRef = useRef<HTMLInputElement>(null);

  // ---------- Partner state ----------
  const [partnersModalOpen, setPartnersModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [partnerForm, setPartnerForm] = useState({
    name: '',
    logo: '',
    website: '',
    order: 0,
  });

  // ---------- Queries ----------
  // Blog
  const {
    data: blogData,
    isLoading: blogLoading,
    error: blogError,
  } = useQuery({
    queryKey: ['blogs', blogPage],
    queryFn: () => blogService.getBlogs({ page: blogPage, limit: 10 }),
    enabled: activeTab === 'blog',
  });

  // Services, Projects, Testimonials, Partners – placeholder queries using the API pattern
  // Since there are no dedicated service functions yet, we inline them via generic approach.
  // We'll create inline fetch wrappers.
  const fetchServices = async (): Promise<{ data: Service[]; totalPages: number }> => {
    const { default: apiClient } = await import('../services/apiClient');
    const res = await apiClient.get('/services?limit=100');
    const payload = res.data?.data || res.data || {};
    // Backend returns { services: [...], page, limit, total, totalPages }
    const services = Array.isArray(payload) ? payload : payload.services || payload.data || [];
    return { data: Array.isArray(services) ? services : [], totalPages: payload.totalPages || 1 };
  };

  const fetchProjects = async (): Promise<{ data: Project[]; totalPages: number }> => {
    const { default: apiClient } = await import('../services/apiClient');
    const res = await apiClient.get('/projects?limit=100');
    const d = res.data?.data || res.data || [];
    // Backend returns ApiResponse with data: { projects: [...], totalPages, ... }
    const projects = Array.isArray(d) ? d : (Array.isArray(d.projects) ? d.projects : []);
    return { data: projects, totalPages: d.totalPages || 1 };
  };

  const fetchTestimonials = async (): Promise<{ data: Testimonial[]; totalPages: number }> => {
    const { default: apiClient } = await import('../services/apiClient');
    const res = await apiClient.get('/testimonials?limit=100');
    const d = res.data?.data || res.data || [];
    // Backend returns ApiResponse with data: { testimonials: [...], totalPages, ... }
    const testimonials = Array.isArray(d) ? d : (Array.isArray(d.testimonials) ? d.testimonials : []);
    return { data: testimonials, totalPages: d.totalPages || 1 };
  };

  const fetchPartners = async (): Promise<{ data: Partner[]; totalPages: number }> => {
    const { default: apiClient } = await import('../services/apiClient');
    const res = await apiClient.get('/partners?limit=100');
    const d = res.data?.data || res.data || [];
    // Backend returns ApiResponse with data: { partners: [...], totalPages, ... }
    const partners = Array.isArray(d) ? d : (Array.isArray(d.partners) ? d.partners : []);
    return { data: partners, totalPages: d.totalPages || 1 };
  };

  const fetchHomepage = async (): Promise<Homepage> => {
    const { default: apiClient } = await import('../services/apiClient');
    const res = await apiClient.get('/homepage');
    return res.data?.data || res.data || {};
  };

  const { data: homepage, isLoading: hpLoading } = useQuery({
    queryKey: ['homepage'],
    queryFn: fetchHomepage,
    enabled: activeTab === 'homepage',
  });

  const { data: servicesData, isLoading: svcLoading } = useQuery({
    queryKey: ['services'],
    queryFn: fetchServices,
    enabled: activeTab === 'services',
  });

  const { data: projectsData, isLoading: projLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    enabled: activeTab === 'projects',
  });

  const { data: testimonialsData, isLoading: testimLoading } = useQuery({
    queryKey: ['testimonials'],
    queryFn: fetchTestimonials,
    enabled: activeTab === 'testimonials',
  });

  const { data: partnersData, isLoading: partLoading } = useQuery({
    queryKey: ['partners'],
    queryFn: fetchPartners,
    enabled: activeTab === 'partners',
  });

  // ---------- Mutations ----------
  const createBlogMutation = useMutation({
    mutationFn: (data: Partial<Blog>) => blogService.createBlog(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      toast.success('Blog post created successfully');
      setBlogModalOpen(false);
      resetBlogForm();
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create blog post'),
  });

  const updateBlogMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Blog> }) => blogService.updateBlog(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      toast.success('Blog post updated successfully');
      setBlogModalOpen(false);
      resetBlogForm();
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update blog post'),
  });

  const deleteBlogMutation = useMutation({
    mutationFn: (id: string) => blogService.deleteBlog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      toast.success('Blog post deleted successfully');
      setBlogDeleteId(null);
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to delete blog post'),
  });

  // Generic mutation helper
  const useGenericMutation = (endpoint: string, queryKey: string, onSuccess?: () => void) =>
    useMutation({
      mutationFn: async (vars: { id?: string; data: any }) => {
        
        const { default: apiClient } = await import('../services/apiClient');
        console.log(`Calling API for ${endpoint} with vars:`, vars); // Log the mutation call
        try {
          let res;
          if (vars.id) {
            res = await apiClient.put(`/${endpoint}/${vars.id}`, vars.data);
          } else {
            console.log("BEFORE RES")
            res = await apiClient.post(`/${endpoint}`, vars.data);
            console.log(`Created new ${endpoint} with ID:`, res.data?._id || res.data?.id || 'unknown'); // Log new ID
          }
          console.log(`API call to /${endpoint} successful:`, res); // Log success response
          return res.data;
        } catch (error: any) {
          console.error(`Raw API call error to /${endpoint}:`, error); // Log raw error
          throw error; // Re-throw to trigger onError callback
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        toast.success('Saved successfully');
        onSuccess?.();
      },
      onError: (err: any) => {
        console.error(`Error in ${queryKey} mutation:`, err);
        toast.error(err?.response?.data?.message || err?.message || 'Operation failed');
      },
    });

  const deleteGenericMutation = (endpoint: string, queryKey: string) =>
    useMutation({
      mutationFn: async (id: string) => {
        const { default: apiClient } = await import('../services/apiClient');
        await apiClient.delete(`/${endpoint}/${id}`);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        toast.success('Deleted successfully');
      },
      onError: (err: any) => toast.error(err?.message || 'Delete failed'),
    });

  const saveServiceMutation = useGenericMutation('services', 'services', () => {
    setServicesModalOpen(false);
    resetServiceForm();
  });
  const deleteServiceMutation = deleteGenericMutation('services', 'services');
  const saveProjectMutation = useGenericMutation('projects', 'projects', () => {
    setProjectsModalOpen(false);
    resetProjectForm();
  });
  const deleteProjectMutation = deleteGenericMutation('projects', 'projects');
  const saveTestimonialMutation = useGenericMutation('testimonials', 'testimonials', () => {
    setTestimonialsModalOpen(false);
    resetTestimonialForm();
  });
  const deleteTestimonialMutation = deleteGenericMutation('testimonials', 'testimonials');
  const savePartnerMutation = useGenericMutation('partners', 'partners', () => {
    setPartnersModalOpen(false);
    resetPartnerForm();
  });
  const deletePartnerMutation = deleteGenericMutation('partners', 'partners');

  // ---------- Form helpers ----------
  const resetBlogForm = () => {
    setEditingBlog(null);
    setBlogForm({ title: '', excerpt: '', content: '', featuredImage: '', gallery: [], author: '', tags: '', category: 'Company News', seoTitle: '', seoDescription: '', status: 'draft', featured: false });
  };

  const openBlogModal = (blog?: Blog) => {
    if (blog) {
      setEditingBlog(blog);
      setBlogForm({
        title: blog.title,
        excerpt: blog.excerpt,
        content: blog.content,
        featuredImage: blog.coverImage?.secureUrl || blog.featuredImage?.secureUrl || '',
        gallery: blog.gallery?.map((g: any) => g.secureUrl) || [],
        author: typeof blog.author === 'string' ? blog.author : '',
        tags: blog.tags.join(', '),
        category: blog.category || 'Company News',
        seoTitle: blog.seoTitle || blog.title,
        seoDescription: blog.seoDescription || blog.excerpt,
        status: blog.status || 'draft',
        featured: blog.featured || false,
      });
    } else {
      resetBlogForm();
    }
    setBlogModalOpen(true);
  };

  const handleBlogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<Blog> = {
      title: blogForm.title,
      excerpt: blogForm.excerpt,
      content: blogForm.content,
      tags: blogForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
      category: blogForm.category,
      seoTitle: blogForm.seoTitle || blogForm.title,
      seoDescription: blogForm.seoDescription || blogForm.excerpt,
      status: blogForm.status,
      featured: blogForm.featured,
    };
    
    // Handle featured image
    if (blogForm.featuredImage) {
      payload.featuredImage = { secureUrl: blogForm.featuredImage, publicId: 'manual', format: 'jpg', bytes: 0 };
    }
    
    // Handle gallery
    if (blogForm.gallery.length > 0) {
      payload.gallery = blogForm.gallery.map((url) => ({
        secureUrl: url,
        publicId: 'manual',
        format: 'jpg',
        bytes: 0,
      }));
    }
    
    // Only include author if it's not empty
    if (blogForm.author && blogForm.author.trim()) {
      payload.author = blogForm.author;
    }
    
    if (editingBlog) {
      updateBlogMutation.mutate({ id: editingBlog._id, data: payload });
    } else {
      createBlogMutation.mutate(payload);
    }
  };

  const handleServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, any> = {
      title: serviceForm.title,
      shortDescription: serviceForm.shortDescription,
      description: serviceForm.description,
      displayOrder: serviceForm.displayOrder,
      status: serviceForm.status,
      featured: serviceForm.featured,
      seoTitle: serviceForm.seoTitle || serviceForm.title,
      seoDescription: serviceForm.seoDescription || serviceForm.shortDescription,
    };
    if (serviceForm.featuredImage) {
      const uploadUrl = serviceForm.featuredImage;
      // If URL starts with http, the image URL was pasted directly or uploaded to cloudinary already
      payload.featuredImage = { secureUrl: uploadUrl, publicId: 'manual', format: 'jpg', bytes: 0 };
    }
    if (serviceForm.gallery.length > 0) {
      payload.gallery = serviceForm.gallery.map((url) => ({
        secureUrl: url, publicId: 'manual', format: 'jpg', bytes: 0,
      }));
    }
    if (serviceForm.serviceFeatures) {
      payload.serviceFeatures = serviceForm.serviceFeatures.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (serviceForm.serviceBenefits) {
      payload.serviceBenefits = serviceForm.serviceBenefits.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (serviceForm.targetAudience) {
      payload.targetAudience = serviceForm.targetAudience.split(',').map((s) => s.trim()).filter(Boolean);
    }
    saveServiceMutation.mutate({
      id: editingService?._id,
      data: payload,
    });
  };

  const resetServiceForm = () => {
    setEditingService(null);
    setServiceForm({
      title: '', shortDescription: '', description: '',
      featuredImage: '', gallery: [], serviceFeatures: '',
      serviceBenefits: '', targetAudience: '', seoTitle: '',
      seoDescription: '', displayOrder: 0, status: 'draft', featured: false,
    });
  };

  const openServiceModal = (svc?: Service) => {
    if (svc) {
      const s = svc as any;
      setEditingService(svc);
      setServiceForm({
        title: s.title || '',
        shortDescription: s.shortDescription || '',
        description: s.description || '',
        featuredImage: s.featuredImage?.secureUrl || '',
        gallery: s.gallery?.map((g: any) => g.secureUrl) || [],
        serviceFeatures: s.serviceFeatures?.join(', ') || '',
        serviceBenefits: s.serviceBenefits?.join(', ') || '',
        targetAudience: s.targetAudience?.join(', ') || '',
        seoTitle: s.seoTitle || '',
        seoDescription: s.seoDescription || '',
        displayOrder: s.displayOrder || 0,
        status: s.status || 'draft',
        featured: s.featured || false,
      });
    } else {
      resetServiceForm();
    }
    setServicesModalOpen(true);
  };

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, any> = {};

    // Required fields — always include
    payload.title = projectForm.title;
    payload.shortDescription = projectForm.shortDescription;
    payload.description = projectForm.description;
    payload.projectCategory = projectForm.projectCategory;

    // Optional string fields — always include (even if empty, backend accepts them as optional)
    payload.projectType = projectForm.projectType || '';
    payload.capacity = projectForm.capacity || '';
    payload.duration = projectForm.duration || '';
    
    // completionDate: only include if it has a value
    if (projectForm.completionDate) {
      payload.completionDate = projectForm.completionDate;
    }
    
    payload.seoTitle = projectForm.seoTitle || '';
    payload.seoDescription = projectForm.seoDescription || '';

    // Boolean / number fields
    payload.featured = projectForm.featured;
    payload.status = projectForm.status;
    payload.displayOrder = projectForm.displayOrder;

    // Handle client object — send even if empty/trimmed to allow clearing it
    if (projectForm.client?.trim()) {
      payload.client = { name: projectForm.client.trim() };
    } else if (editingProject) {
      // When updating, send empty object to potentially clear client
      payload.client = null;
    }

    // Handle featured image — only send when URL is provided
    if (projectForm.featuredImage?.trim()) {
      payload.featuredImage = { secureUrl: projectForm.featuredImage, publicId: 'manual', format: 'jpg', bytes: 0 };
    }

    // Handle gallery images — send as array (empty or with items)
    payload.gallery = projectForm.gallery.map((url) => ({
      secureUrl: url,
      publicId: 'manual',
      format: 'jpg',
      bytes: 0,
    }));

    // Handle before images — send as array (empty or with items)
    payload.beforeImages = projectForm.beforeImages.map((url) => ({
      secureUrl: url,
      publicId: 'manual',
      format: 'jpg',
      bytes: 0,
    }));

    // Handle after images — send as array (empty or with items)
    payload.afterImages = projectForm.afterImages.map((url) => ({
      secureUrl: url,
      publicId: 'manual',
      format: 'jpg',
      bytes: 0,
    }));

    // Convert comma-separated strings to arrays
    payload.technologiesUsed = projectForm.technologiesUsed 
      ? projectForm.technologiesUsed.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    payload.projectChallenges = projectForm.projectChallenges
      ? projectForm.projectChallenges.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    payload.projectSolutions = projectForm.projectSolutions
      ? projectForm.projectSolutions.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    payload.projectResults = projectForm.projectResults
      ? projectForm.projectResults.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    console.log("PAYLOAD : ", payload)

    saveProjectMutation.mutate({
      id: editingProject?._id,
      data: payload,
    });
  };

  const resetProjectForm = () => {
    setEditingProject(null);
    setProjectForm({
      title: '',
      slug: '',
      shortDescription: '',
      description: '',
      client: '',
      projectCategory: '',
      projectType: '',
      capacity: '',
      duration: '',
      completionDate: '',
      featuredImage: '',
      gallery: [],
      beforeImages: [],
      afterImages: [],
      technologiesUsed: '',
      projectChallenges: '',
      projectSolutions: '',
      projectResults: '',
      featured: false,
      status: 'draft',
      displayOrder: 0,
      seoTitle: '',
      seoDescription: '',
      isActive: true,
    });
  };

  const openProjectModal = (proj?: Project) => {
    if (proj) {
      setEditingProject(proj);
      // Handle client - could be string or object
      let clientName = '';
      if (typeof proj.client === 'string') {
        clientName = proj.client;
      } else if (proj.client && typeof proj.client === 'object' && 'name' in proj.client) {
        clientName = (proj.client as any).name;
      }
      
      setProjectForm({
        title: proj.title || '',
        slug: proj.slug || '',
        shortDescription: proj.shortDescription || '',
        description: proj.description || '',
        client: clientName,
        projectCategory: proj.projectCategory || '',
        projectType: proj.projectType || '',
        capacity: proj.capacity || '',
        duration: proj.duration || '',
        completionDate: proj.completionDate || '',
        featuredImage: proj.featuredImage?.secureUrl || '',
        gallery: proj.gallery?.map((img) => img.secureUrl) || [],
        beforeImages: proj.beforeImages?.map((img) => img.secureUrl) || [],
        afterImages: proj.afterImages?.map((img) => img.secureUrl) || [],
        technologiesUsed: proj.technologiesUsed?.join(', ') || '',
        projectChallenges: proj.projectChallenges?.join(', ') || '',
        projectSolutions: proj.projectSolutions?.join(', ') || '',
        projectResults: proj.projectResults?.join(', ') || '',
        featured: proj.featured || false,
        status: proj.status || 'draft',
        displayOrder: proj.displayOrder || 0,
        seoTitle: proj.seoTitle || '',
        seoDescription: proj.seoDescription || '',
        isActive: proj.isActive || true,
      });
    } else {
      resetProjectForm();
    }
    setProjectsModalOpen(true);
  };

  const handleTestimonialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, any> = {
      clientName: testimonialForm.clientName,
      clientTitle: testimonialForm.clientTitle || undefined,
      testimonialText: testimonialForm.testimonialText,
      rating: testimonialForm.rating,
      featured: testimonialForm.featured,
      status: testimonialForm.status,
    };
    if (testimonialForm.image) {
      payload.image = {
        secure_url: testimonialForm.image.secure_url,
        public_id: testimonialForm.image.public_id,
      };
    }
    saveTestimonialMutation.mutate({
      id: editingTestimonial?._id,
      data: payload,
    });
  };

  const resetTestimonialForm = () => {
    setEditingTestimonial(null);
    setTestimonialForm({
      clientName: '',
      clientTitle: '',
      testimonialText: '',
      rating: 5,
      image: null,
      featured: false,
      status: 'pending',
    });
  };

  const openTestimonialModal = (testim?: Testimonial) => {
    if (testim) {
      setEditingTestimonial(testim);
      setTestimonialForm({
        clientName: testim.clientName,
        clientTitle: testim.clientTitle || '',
        testimonialText: testim.testimonialText,
        rating: testim.rating,
        image: testim.image ? { secure_url: testim.image.secureUrl, public_id: testim.image.publicId } : null,
        featured: testim.featured,
        status: testim.status,
      });
    } else {
      resetTestimonialForm();
    }
    setTestimonialsModalOpen(true);
  };

  const handlePartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    savePartnerMutation.mutate({
      id: editingPartner?._id,
      data: partnerForm,
    });
  };

  const resetPartnerForm = () => {
    setEditingPartner(null);
    setPartnerForm({ name: '', logo: '', website: '', order: 0 });
  };

  const openPartnerModal = (partner?: Partner) => {
    if (partner) {
      setEditingPartner(partner);
      setPartnerForm({
        name: partner.name,
        logo: partner.logo?.secureUrl || '',
        website: partner.website || '',
        order: partner.order,
      });
    } else {
      resetPartnerForm();
    }
    setPartnersModalOpen(true);
  };

  // ---------- Homepage editor state ----------
  const [heroForm, setHeroForm] = useState<HeroSection>({
    title: '',
    subtitle: '',
    ctaText: '',
    ctaLink: '',
    backgroundImage: undefined,
  });
  const [aboutForm, setAboutForm] = useState({ title: '', content: '', image: '' });
  const [statsForm, setStatsForm] = useState({ title: '', stats: '' });
  const [bannersForm, setBannersForm] = useState<Banner[]>([]);
  const [hpEditMode, setHpEditMode] = useState(false);

  const loadHomepageForm = () => {
    if (homepage) {
      setHeroForm({
        title: homepage.hero?.title || '',
        subtitle: homepage.hero?.subtitle || '',
        ctaText: homepage.hero?.ctaText || '',
        ctaLink: homepage.hero?.ctaLink || '',
        backgroundImage: homepage.hero?.backgroundImage,
      });
      setAboutForm({
        title: homepage.aboutSection?.title || '',
        content: homepage.aboutSection?.content || '',
        image: homepage.aboutSection?.image?.secureUrl || '',
      });
      setStatsForm({
        title: homepage.statsSection?.title || '',
        stats: homepage.statsSection?.stats?.map((s) => `${s.label}:${s.value}:${s.icon}`).join('\n') || '',
      });
      setBannersForm(homepage.banners || []);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'homepage' && homepage) {
      loadHomepageForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homepage, activeTab]);

  const saveHomepageMutation = useMutation({
    mutationFn: async (data: Partial<Homepage>) => {
      const { default: apiClient } = await import('../services/apiClient');
      const res = await apiClient.put('/homepage', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage'] });
      toast.success('Homepage saved successfully');
      setHpEditMode(false);
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to save homepage'),
  });

  const handleHomepageSave = () => {
    const stats: { label: string; value: string; icon: string }[] = statsForm.stats
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(':');
        return { label: parts[0] || '', value: parts[1] || '', icon: parts[2] || '' };
      });

    saveHomepageMutation.mutate({
      hero: {
        ...heroForm,
        backgroundImage: heroForm.backgroundImage,
      },
      aboutSection: {
        title: aboutForm.title,
        content: aboutForm.content,
        image: aboutForm.image ? { secureUrl: aboutForm.image, publicId: '', format: '', bytes: 0 } : undefined,
      },
      statsSection: {
        title: statsForm.title,
        stats,
      },
      banners: bannersForm,
    });
  };

  const addBanner = () => {
    setBannersForm((prev) => [
      ...prev,
      { title: '', subtitle: '', image: { secureUrl: '', publicId: '', format: '', bytes: 0 }, link: '', isActive: true },
    ]);
  };

  const updateBanner = (idx: number, field: keyof Banner, value: any) => {
    setBannersForm((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const removeBanner = (idx: number) => {
    setBannersForm((prev) => prev.filter((_, i) => i !== idx));
  };

  // ---------- Common input classes ----------
  const inputClass =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';
  const btnPrimary =
    'px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors';
  const btnSecondary =
    'px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors';
  const btnDanger =
    'px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors';

  // ---------- Column definitions ----------
  const blogColumns: Column<Blog>[] = [
    { key: 'title', header: 'Title', render: (b) => <span className="font-medium">{b.title}</span> },
    { key: 'author', header: 'Author', render: (b) => {
      const author = b.author;
      if (!author) return '-';
      if (typeof author === 'string') return author;
      return `${author.firstName || ''} ${author.lastName || ''}`.trim() || '-';
    }},
    { key: 'isPublished', header: 'Status', render: (b) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${b.isPublished ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'}`}>
        {b.isPublished ? 'Published' : 'Draft'}
      </span>
    )},
    { key: 'createdAt', header: 'Date', render: (b) => new Date(b.createdAt).toLocaleDateString() },
  ];

  const svcColumns: Column<Service>[] = [
    { key: 'title', header: 'Title', render: (s) => <span className="font-medium">{(s as any).title}</span> },
    { key: 'featuredImage', header: 'Image', render: (s) => {
      const img = (s as any).featuredImage?.secureUrl;
      return img ? <img src={img} alt="" className="h-10 w-10 rounded-lg object-cover border border-gray-200 dark:border-gray-600" /> : <span className="text-gray-400">—</span>;
    }},
    { key: 'displayOrder', header: 'Order', render: (s) => <span>{(s as any).displayOrder ?? 0}</span> },
    { key: 'status', header: 'Status', render: (s) => {
      const status = (s as any).status || 'draft';
      const colors: Record<string, string> = {
        draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
        published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        archived: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      };
      return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.draft}`}>{status}</span>;
    }},
  ];

  const projColumns: Column<Project>[] = [
    { key: 'title', header: 'Title', render: (p) => <span className="font-medium">{p.title}</span> },
    { key: 'client', header: 'Client' },
    { key: 'location', header: 'Location' },
    { key: 'completionDate', header: 'Completed', render: (p) => p.completionDate ? new Date(p.completionDate).toLocaleDateString() : '-' },
    { key: 'isActive', header: 'Status', render: (p) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
        {p.isActive ? 'Active' : 'Inactive'}
      </span>
    )},
  ];

  const testimColumns: Column<Testimonial>[] = [
    { key: 'clientName', header: 'Client', render: (t) => (
      <div className="flex items-center gap-2">
        {t.image?.secureUrl && <img src={t.image.secureUrl} alt="" className="h-8 w-8 rounded-full object-cover" />}
        <span className="font-medium">{t.clientName}</span>
      </div>
    )},
    { key: 'clientTitle', header: 'Title' },
    { key: 'rating', header: 'Rating', render: (t) => <RatingStars rating={t.rating} /> },
    { key: 'status', header: 'Status', render: (t) => {
      const colors: Record<string, string> = {
        approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
        rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      };
      return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[t.status] || colors.pending}`}>{t.status}</span>;
    }},
    { key: 'featured', header: 'Featured', render: (t) => t.featured ? <span className="text-green-600 font-medium">Yes</span> : <span className="text-gray-400">No</span> },
  ];

  const partnerColumns: Column<Partner>[] = [
    { key: 'name', header: 'Name', render: (p) => (
      <div className="flex items-center gap-2">
        {p.logo?.secureUrl && <img src={p.logo.secureUrl} alt="" className="h-8 w-8 object-contain" />}
        <span className="font-medium">{p.name}</span>
      </div>
    )},
    { key: 'website', header: 'Website', render: (p) => p.website ? <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">{p.website}</a> : '-' },
    { key: 'order', header: 'Order' },
  ];

  // ---------- Render helpers ----------
  const renderTabNav = () => (
    <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === tab.key
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  // ---------- Homepage Editor ----------
  const renderHomepageTab = () => {
    if (hpLoading) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Hero Section</h3>
            {!hpEditMode && (
              <button onClick={() => setHpEditMode(true)} className="text-indigo-600 dark:text-indigo-400 text-sm hover:underline">Edit</button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Title</label>
              <input className={inputClass} value={heroForm.title} onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })} disabled={!hpEditMode} />
            </div>
            <div>
              <label className={labelClass}>Subtitle</label>
              <input className={inputClass} value={heroForm.subtitle} onChange={(e) => setHeroForm({ ...heroForm, subtitle: e.target.value })} disabled={!hpEditMode} />
            </div>
            <div>
              <label className={labelClass}>CTA Text</label>
              <input className={inputClass} value={heroForm.ctaText} onChange={(e) => setHeroForm({ ...heroForm, ctaText: e.target.value })} disabled={!hpEditMode} />
            </div>
            <div>
              <label className={labelClass}>CTA Link</label>
              <input className={inputClass} value={heroForm.ctaLink} onChange={(e) => setHeroForm({ ...heroForm, ctaLink: e.target.value })} disabled={!hpEditMode} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Background Image URL</label>
              <input className={inputClass} value={(heroForm.backgroundImage as any)?.secureUrl || ''} onChange={(e) => setHeroForm({ ...heroForm, backgroundImage: e.target.value ? { secureUrl: e.target.value, publicId: '', format: '', bytes: 0 } : undefined })} disabled={!hpEditMode} placeholder="https://..." />
            </div>
          </div>
        </div>

        {/* Banners */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Banners</h3>
            {hpEditMode && (
              <button onClick={addBanner} className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                <PlusIcon className="h-4 w-4" /> Add Banner
              </button>
            )}
          </div>
          {bannersForm.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm">No banners yet.</p>}
          {bannersForm.map((banner, idx) => (
            <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-3 relative">
              {hpEditMode && (
                <button onClick={() => removeBanner(idx)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Title</label>
                  <input className={inputClass} value={banner.title} onChange={(e) => updateBanner(idx, 'title', e.target.value)} disabled={!hpEditMode} />
                </div>
                <div>
                  <label className={labelClass}>Subtitle</label>
                  <input className={inputClass} value={banner.subtitle} onChange={(e) => updateBanner(idx, 'subtitle', e.target.value)} disabled={!hpEditMode} />
                </div>
                <div>
                  <label className={labelClass}>Image URL</label>
                  <input className={inputClass} value={banner.image?.secureUrl || ''} onChange={(e) => updateBanner(idx, 'image', { secureUrl: e.target.value, publicId: '', format: '', bytes: 0 })} disabled={!hpEditMode} />
                </div>
                <div>
                  <label className={labelClass}>Link</label>
                  <input className={inputClass} value={banner.link} onChange={(e) => updateBanner(idx, 'link', e.target.value)} disabled={!hpEditMode} />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={banner.isActive} onChange={(e) => updateBanner(idx, 'isActive', e.target.checked)} disabled={!hpEditMode} className="rounded border-gray-300 dark:border-gray-600" />
                  <label className="text-sm text-gray-700 dark:text-gray-300">Active</label>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* About Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">About Section</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Title</label>
              <input className={inputClass} value={aboutForm.title} onChange={(e) => setAboutForm({ ...aboutForm, title: e.target.value })} disabled={!hpEditMode} />
            </div>
            <div>
              <label className={labelClass}>Image URL</label>
              <input className={inputClass} value={aboutForm.image} onChange={(e) => setAboutForm({ ...aboutForm, image: e.target.value })} disabled={!hpEditMode} placeholder="https://..." />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Content</label>
              <textarea className={inputClass} rows={4} value={aboutForm.content} onChange={(e) => setAboutForm({ ...aboutForm, content: e.target.value })} disabled={!hpEditMode} />
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Stats Section</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={labelClass}>Section Title</label>
              <input className={inputClass} value={statsForm.title} onChange={(e) => setStatsForm({ ...statsForm, title: e.target.value })} disabled={!hpEditMode} />
            </div>
            <div>
              <label className={labelClass}>Stats (one per line, format: Label:Value:Icon)</label>
              <textarea className={inputClass} rows={4} value={statsForm.stats} onChange={(e) => setStatsForm({ ...statsForm, stats: e.target.value })} disabled={!hpEditMode} placeholder="Projects Completed:500:briefcase&#10;Happy Clients:200:users&#10;Years Experience:15:clock" />
            </div>
          </div>
        </div>

        {hpEditMode && (
          <div className="flex justify-end gap-3">
            <button onClick={() => setHpEditMode(false)} className={btnSecondary}>Cancel</button>
            <button onClick={handleHomepageSave} className={btnPrimary} disabled={saveHomepageMutation.isPending}>
              {saveHomepageMutation.isPending ? 'Saving...' : 'Save Homepage'}
            </button>
          </div>
        )}
      </div>
    );
  };

  // ---------- Blog Tab ----------
  const renderBlogTab = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Blog Posts</h3>
        <button onClick={() => openBlogModal()} className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
          <PlusIcon className="h-4 w-4" /> New Post
        </button>
      </div>
      <DataTable
        columns={blogColumns}
        data={blogData?.data || []}
        loading={blogLoading}
        error={blogError?.message || ''}
        page={blogPage}
        totalPages={blogData?.totalPages || 1}
        onPageChange={setBlogPage}
        onSearch={(q) => console.log('search:', q)}
        actions={(blog) => (
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => openBlogModal(blog)} className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded">
              <PencilSquareIcon className="h-4 w-4" />
            </button>
            <button onClick={() => setBlogDeleteId(blog._id)} className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      {/* Blog form modal */}
      <Modal isOpen={blogModalOpen} onClose={() => { setBlogModalOpen(false); resetBlogForm(); }} title={editingBlog ? 'Edit Blog Post' : 'Create Blog Post'} size="lg">
        <form onSubmit={handleBlogSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Title *</label>
              <input className={inputClass} value={blogForm.title} onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })} required />
            </div>
            <div>
              <label className={labelClass}>Category *</label>
              <select className={inputClass} value={blogForm.category} onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })} required>
                <option value="Company News">Company News</option>
                <option value="Solar Guides">Solar Guides</option>
                <option value="Energy Tips">Energy Tips</option>
                <option value="Product Updates">Product Updates</option>
                <option value="Installation Tips">Installation Tips</option>
                <option value="Success Stories">Success Stories</option>
                <option value="Industry News">Industry News</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Excerpt *</label>
            <textarea className={inputClass} rows={2} value={blogForm.excerpt} onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })} required />
          </div>
          <div>
            <label className={labelClass}>Content *</label>
            <textarea className={inputClass} rows={6} value={blogForm.content} onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>SEO Title *</label>
              <input className={inputClass} value={blogForm.seoTitle} onChange={(e) => setBlogForm({ ...blogForm, seoTitle: e.target.value })} required />
            </div>
            <div>
              <label className={labelClass}>SEO Description *</label>
              <input className={inputClass} value={blogForm.seoDescription} onChange={(e) => setBlogForm({ ...blogForm, seoDescription: e.target.value })} required />
            </div>
          </div>

          {/* Featured Image Upload Section */}
          <div className="brutal-card p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-3">Featured Image</h4>
            {blogForm.featuredImage && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 mb-3 group">
                <img src={blogForm.featuredImage} alt="Featured" className="w-full h-full object-cover" />
                <button 
                  type="button" 
                  onClick={() => setBlogForm({ ...blogForm, featuredImage: '' })} 
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
              <CloudArrowUpIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Upload featured image to Cloudinary</p>
              <input 
                ref={blogCoverImageInputRef} 
                type="file" 
                accept="image/*" 
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingBlogCoverImage(true);
                  try {
                    const result = await uploadToCloudinary(file, 'sapres/blogs');
                    setBlogForm({ ...blogForm, featuredImage: result.secure_url });
                    toast.success('Featured image uploaded');
                  } catch (err: any) {
                    toast.error(err.message || 'Upload failed');
                  } finally {
                    setUploadingBlogCoverImage(false);
                    if (blogCoverImageInputRef.current) blogCoverImageInputRef.current.value = '';
                  }
                }} 
                disabled={uploadingBlogCoverImage} 
                className="block w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed" 
              />
              {uploadingBlogCoverImage && <p className="text-xs text-indigo-600 mt-2 font-medium">Uploading...</p>}
            </div>
          </div>

          {/* Gallery Upload Section */}
          <div className="brutal-card p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-3">Gallery Images</h4>
            {blogForm.gallery.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {blogForm.gallery.map((url, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 group">
                    <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => setBlogForm({ ...blogForm, gallery: blogForm.gallery.filter((_, idx) => idx !== i) })}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
              <CloudArrowUpIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Upload gallery images (max 10)</p>
              <input 
                ref={blogGalleryInputRef} 
                type="file" 
                accept="image/*" 
                multiple
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files || files.length === 0) return;
                  if (blogForm.gallery.length + files.length > 10) {
                    toast.warning('Maximum 10 gallery images allowed');
                    return;
                  }
                  setUploadingBlogGallery(true);
                  try {
                    const results = await Promise.all(
                      Array.from(files).map((f) => uploadToCloudinary(f, 'sapres/blogs'))
                    );
                    const newUrls = results.map((r) => r.secure_url);
                    setBlogForm({ ...blogForm, gallery: [...blogForm.gallery, ...newUrls] });
                    toast.success(`${newUrls.length} image(s) uploaded`);
                  } catch (err: any) {
                    toast.error(err.message || 'Upload failed');
                  } finally {
                    setUploadingBlogGallery(false);
                    if (blogGalleryInputRef.current) blogGalleryInputRef.current.value = '';
                  }
                }} 
                disabled={uploadingBlogGallery} 
                className="block w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed" 
              />
              {uploadingBlogGallery && <p className="text-xs text-indigo-600 mt-2 font-medium">Uploading...</p>}
            </div>
          </div>

          <div>
            <label className={labelClass}>Tags (comma separated)</label>
            <input className={inputClass} value={blogForm.tags} onChange={(e) => setBlogForm({ ...blogForm, tags: e.target.value })} placeholder="tech, business, news" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={blogForm.status === 'published'} onChange={(e) => setBlogForm({ ...blogForm, status: e.target.checked ? 'published' : 'draft' })} className="rounded border-gray-300 dark:border-gray-600" />
              <label className="text-sm text-gray-700 dark:text-gray-300">Published</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={blogForm.featured} onChange={(e) => setBlogForm({ ...blogForm, featured: e.target.checked })} className="rounded border-gray-300 dark:border-gray-600" />
              <label className="text-sm text-gray-700 dark:text-gray-300">Featured</label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setBlogModalOpen(false); resetBlogForm(); }} className={btnSecondary}>Cancel</button>
            <button type="submit" className={btnPrimary} disabled={createBlogMutation.isPending || updateBlogMutation.isPending}>
              {editingBlog ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal isOpen={!!blogDeleteId} onClose={() => setBlogDeleteId(null)} title="Confirm Delete" size="sm">
        <p className="text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to delete this blog post? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setBlogDeleteId(null)} className={btnSecondary}>Cancel</button>
          <button onClick={() => deleteBlogMutation.mutate(blogDeleteId!)} className={btnDanger} disabled={deleteBlogMutation.isPending}>
            {deleteBlogMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );

  // ---------- Reusable inline CRUD table renderer ----------
  const renderCRUDTab = <T extends { _id: string }>({
    data,
    loading,
    columns,
    onEdit,
    onDelete,
    onCreateLabel,
    onOpenCreate,
    modal,
  }: {
    data: T[];
    loading: boolean;
    columns: Column<T>[];
    onEdit: (item: T) => void;
    onDelete: (id: string) => void;
    onCreateLabel: string;
    onOpenCreate: () => void;
    modal: React.ReactNode;
  }) => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{onCreateLabel.replace('New ', '')}s</h3>
        <button onClick={onOpenCreate} className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
          <PlusIcon className="h-4 w-4" /> {onCreateLabel}
        </button>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6">
            <CardSkeleton />
          </div>
        ) : data.length === 0 ? (
          <p className="p-6 text-gray-500 dark:text-gray-400 text-center">No items found.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {col.header}
                  </th>
                ))}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {col.render ? col.render(item) : (item as any)[col.key] ?? '-'}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => onEdit(item)} className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded mr-1">
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button onClick={() => onDelete(item._id)} className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {modal}
    </div>
  );

  // ---------- Services Tab ----------
  const renderServicesTab = () => renderCRUDTab<Service>({
    data: servicesData?.data || [],
    loading: svcLoading,
    columns: svcColumns,
    onEdit: openServiceModal,
    onDelete: (id) => deleteServiceMutation.mutate(id),
    onCreateLabel: 'New Service',
    onOpenCreate: () => openServiceModal(),
    modal: (
      <Modal isOpen={servicesModalOpen} onClose={() => { setServicesModalOpen(false); resetServiceForm(); }} title={editingService ? 'Edit Service' : 'New Service'} size="xl">
        <form onSubmit={handleServiceSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Core fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Title *</label>
              <input className={inputClass} value={serviceForm.title} onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })} required />
            </div>
            <div>
              <label className={labelClass}>SEO Title</label>
              <input className={inputClass} value={serviceForm.seoTitle} onChange={(e) => setServiceForm({ ...serviceForm, seoTitle: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Short Description *</label>
            <textarea className={inputClass} rows={2} value={serviceForm.shortDescription} onChange={(e) => setServiceForm({ ...serviceForm, shortDescription: e.target.value })} required placeholder="Brief overview of the service (10-500 chars)" />
          </div>
          <div>
            <label className={labelClass}>Full Description *</label>
            <textarea className={inputClass} rows={4} value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} required placeholder="Detailed service description (min 20 chars)" />
          </div>
          <div>
            <label className={labelClass}>SEO Description</label>
            <textarea className={inputClass} rows={2} value={serviceForm.seoDescription} onChange={(e) => setServiceForm({ ...serviceForm, seoDescription: e.target.value })} placeholder="SEO meta description" />
          </div>

          {/* Featured Image */}
          <div className="brutal-card p-4">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-3">Featured Image</h4>
            {serviceForm.featuredImage && (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 mb-3 group">
                <img src={serviceForm.featuredImage} alt="Featured" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setServiceForm({ ...serviceForm, featuredImage: '' })} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </div>
            )}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
              <CloudArrowUpIcon className="h-6 w-6 mx-auto text-gray-400 mb-1" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Upload featured image to Cloudinary</p>
              <input ref={serviceImageInputRef} type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploadingServiceImage(true);
                try {
                  const result = await uploadToCloudinary(file);
                  setServiceForm({ ...serviceForm, featuredImage: result.secure_url });
                  toast.success('Featured image uploaded');
                } catch (err: any) {
                  toast.error(err.message || 'Upload failed');
                } finally {
                  setUploadingServiceImage(false);
                  if (serviceImageInputRef.current) serviceImageInputRef.current.value = '';
                }
              }} disabled={uploadingServiceImage} className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              {uploadingServiceImage && <p className="text-xs text-emerald-600 mt-1">Uploading...</p>}
            </div>
          </div>

          {/* Gallery */}
          <div className="brutal-card p-4">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-3">Gallery Images</h4>
            {serviceForm.gallery.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {serviceForm.gallery.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setServiceForm({ ...serviceForm, gallery: serviceForm.gallery.filter((_, j) => j !== i) })} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
              <CloudArrowUpIcon className="h-6 w-6 mx-auto text-gray-400 mb-1" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Upload gallery images (max 10)</p>
              <input ref={serviceGalleryInputRef} type="file" accept="image/*" multiple onChange={async (e) => {
                const files = e.target.files;
                if (!files || files.length === 0) return;
                setUploadingServiceGallery(true);
                try {
                  const results = await Promise.all(Array.from(files).map((f) => uploadToCloudinary(f)));
                  const urls = results.map((r) => r.secure_url);
                  setServiceForm({ ...serviceForm, gallery: [...serviceForm.gallery, ...urls] });
                  toast.success(`${urls.length} image(s) uploaded`);
                } catch (err: any) {
                  toast.error(err.message || 'Upload failed');
                } finally {
                  setUploadingServiceGallery(false);
                  if (serviceGalleryInputRef.current) serviceGalleryInputRef.current.value = '';
                }
              }} disabled={uploadingServiceGallery} className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              {uploadingServiceGallery && <p className="text-xs text-emerald-600 mt-1">Uploading...</p>}
            </div>
          </div>

          {/* Features & Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Features (comma separated)</label>
              <textarea className={inputClass} rows={3} value={serviceForm.serviceFeatures} onChange={(e) => setServiceForm({ ...serviceForm, serviceFeatures: e.target.value })} placeholder="24/7 support, Custom setup, Free consultation" />
            </div>
            <div>
              <label className={labelClass}>Benefits (comma separated)</label>
              <textarea className={inputClass} rows={3} value={serviceForm.serviceBenefits} onChange={(e) => setServiceForm({ ...serviceForm, serviceBenefits: e.target.value })} placeholder="Save time, Reduce costs, Improve efficiency" />
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label className={labelClass}>Target Audience (comma separated)</label>
            <input className={inputClass} value={serviceForm.targetAudience} onChange={(e) => setServiceForm({ ...serviceForm, targetAudience: e.target.value })} placeholder="SMEs, Large enterprises, Government" />
          </div>

          {/* Settings row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Display Order</label>
              <input type="number" className={inputClass} value={serviceForm.displayOrder} onChange={(e) => setServiceForm({ ...serviceForm, displayOrder: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select className={inputClass} value={serviceForm.status} onChange={(e) => setServiceForm({ ...serviceForm, status: e.target.value as 'draft' | 'published' })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" checked={serviceForm.featured} onChange={(e) => setServiceForm({ ...serviceForm, featured: e.target.checked })} className="rounded border-gray-300 dark:border-gray-600 w-4 h-4" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Featured</label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => { setServicesModalOpen(false); resetServiceForm(); }} className={btnSecondary}>Cancel</button>
            <button type="submit" className={btnPrimary} disabled={saveServiceMutation.isPending}>
              {editingService ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    ),
  });

  // ---------- Projects Tab ----------
  const renderProjectsTab = () => renderCRUDTab<Project>({
    data: projectsData?.data || [],
    loading: projLoading,
    columns: projColumns,
    onEdit: openProjectModal,
    onDelete: (id) => deleteProjectMutation.mutate(id),
    onCreateLabel: 'New Project',
    onOpenCreate: () => openProjectModal(),
    modal: (
      <Modal isOpen={projectsModalOpen} onClose={() => { setProjectsModalOpen(false); resetProjectForm(); }} title={editingProject ? 'Edit Project' : 'New Project'} size="xl">
        <form onSubmit={handleProjectSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Core fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Title *</label>
              <input className={inputClass} value={projectForm.title} onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} required />
            </div>
            <div>
              <label className={labelClass}>Slug</label>
              <input className={inputClass} value={projectForm.slug} onChange={(e) => setProjectForm({ ...projectForm, slug: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Short Description *</label>
            <textarea className={inputClass} rows={2} value={projectForm.shortDescription} onChange={(e) => setProjectForm({ ...projectForm, shortDescription: e.target.value })} required placeholder="Brief overview of the project (10-500 chars)" minLength={10} />
          </div>
          <div>
            <label className={labelClass}>Full Description *</label>
            <textarea className={inputClass} rows={4} value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} required placeholder="Detailed project description (min 20 chars)" minLength={20} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Client</label>
              <input className={inputClass} value={projectForm.client} onChange={(e) => setProjectForm({ ...projectForm, client: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Project Category *</label>
              <input className={inputClass} value={projectForm.projectCategory} onChange={(e) => setProjectForm({ ...projectForm, projectCategory: e.target.value })} required minLength={3} />
            </div>
            <div>
              <label className={labelClass}>Project Type</label>
              <input className={inputClass} value={projectForm.projectType} onChange={(e) => setProjectForm({ ...projectForm, projectType: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Capacity</label>
              <input className={inputClass} value={projectForm.capacity} onChange={(e) => setProjectForm({ ...projectForm, capacity: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Duration</label>
              <input className={inputClass} value={projectForm.duration} onChange={(e) => setProjectForm({ ...projectForm, duration: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Completion Date</label>
              <input type="date" className={inputClass} value={projectForm.completionDate} onChange={(e) => setProjectForm({ ...projectForm, completionDate: e.target.value })} />
            </div>
          </div>

          {/* Featured Image */}
          <div className="brutal-card p-4">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-3">Featured Image</h4>
            {projectForm.featuredImage && (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 mb-3 group">
                <img src={projectForm.featuredImage} alt="Featured" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setProjectForm({ ...projectForm, featuredImage: '' })} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </div>
            )}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
              <CloudArrowUpIcon className="h-6 w-6 mx-auto text-gray-400 mb-1" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Upload featured image to Cloudinary</p>
              <input ref={featuredImageInputRef} type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploadingFeaturedImage(true);
                try {
                  const result = await uploadToCloudinary(file);
                  setProjectForm({ ...projectForm, featuredImage: result.secure_url });
                  toast.success('Featured image uploaded');
                } catch (err: any) {
                  toast.error(err.message || 'Upload failed');
                } finally {
                  setUploadingFeaturedImage(false);
                  if (featuredImageInputRef.current) featuredImageInputRef.current.value = '';
                }
              }} disabled={uploadingFeaturedImage} className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              {uploadingFeaturedImage && <p className="text-xs text-emerald-600 mt-1">Uploading...</p>}
            </div>
          </div>

          {/* Gallery */}
          <div className="brutal-card p-4">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-3">Gallery Images</h4>
            {projectForm.gallery.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {projectForm.gallery.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setProjectForm({ ...projectForm, gallery: projectForm.gallery.filter((_, j) => j !== i) })} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
              <CloudArrowUpIcon className="h-6 w-6 mx-auto text-gray-400 mb-1" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Upload gallery images (max 10)</p>
              <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={async (e) => {
                const files = e.target.files;
                if (!files || files.length === 0) return;
                setUploadingGallery(true);
                try {
                  const results = await Promise.all(Array.from(files).map((f) => uploadToCloudinary(f)));
                  const urls = results.map((r) => r.secure_url);
                  setProjectForm({ ...projectForm, gallery: [...projectForm.gallery, ...urls] });
                  toast.success(`${urls.length} image(s) uploaded`);
                } catch (err: any) {
                  toast.error(err.message || 'Upload failed');
                } finally {
                  setUploadingGallery(false);
                  if (galleryInputRef.current) galleryInputRef.current.value = '';
                }
              }} disabled={uploadingGallery} className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              {uploadingGallery && <p className="text-xs text-emerald-600 mt-1">Uploading...</p>}
            </div>
          </div>

          {/* Before Images */}
          <div className="brutal-card p-4">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-3">Before Images</h4>
            {projectForm.beforeImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {projectForm.beforeImages.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setProjectForm({ ...projectForm, beforeImages: projectForm.beforeImages.filter((_, j) => j !== i) })} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
              <CloudArrowUpIcon className="h-6 w-6 mx-auto text-gray-400 mb-1" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Upload before images (max 10)</p>
              <input ref={beforeImagesInputRef} type="file" accept="image/*" multiple onChange={async (e) => {
                const files = e.target.files;
                if (!files || files.length === 0) return;
                setUploadingBeforeImages(true);
                try {
                  const results = await Promise.all(Array.from(files).map((f) => uploadToCloudinary(f)));
                  const urls = results.map((r) => r.secure_url);
                  setProjectForm({ ...projectForm, beforeImages: [...projectForm.beforeImages, ...urls] });
                  toast.success(`${urls.length} image(s) uploaded`);
                } catch (err: any) {
                  toast.error(err.message || 'Upload failed');
                } finally {
                  setUploadingBeforeImages(false);
                  if (beforeImagesInputRef.current) beforeImagesInputRef.current.value = '';
                }
              }} disabled={uploadingBeforeImages} className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              {uploadingBeforeImages && <p className="text-xs text-emerald-600 mt-1">Uploading...</p>}
            </div>
          </div>

          {/* After Images */}
          <div className="brutal-card p-4">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-3">After Images</h4>
            {projectForm.afterImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {projectForm.afterImages.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setProjectForm({ ...projectForm, afterImages: projectForm.afterImages.filter((_, j) => j !== i) })} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
              <CloudArrowUpIcon className="h-6 w-6 mx-auto text-gray-400 mb-1" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Upload after images (max 10)</p>
              <input ref={afterImagesInputRef} type="file" accept="image/*" multiple onChange={async (e) => {
                const files = e.target.files;
                if (!files || files.length === 0) return;
                setUploadingAfterImages(true);
                try {
                  const results = await Promise.all(Array.from(files).map((f) => uploadToCloudinary(f)));
                  const urls = results.map((r) => r.secure_url);
                  setProjectForm({ ...projectForm, afterImages: [...projectForm.afterImages, ...urls] });
                  toast.success(`${urls.length} image(s) uploaded`);
                } catch (err: any) {
                  toast.error(err.message || 'Upload failed');
                } finally {
                  setUploadingAfterImages(false);
                  if (afterImagesInputRef.current) afterImagesInputRef.current.value = '';
                }
              }} disabled={uploadingAfterImages} className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              {uploadingAfterImages && <p className="text-xs text-emerald-600 mt-1">Uploading...</p>}
            </div>
          </div>

          {/* Technologies Used */}
          <div>
            <label className={labelClass}>Technologies Used (comma separated)</label>
            <textarea className={inputClass} rows={2} value={projectForm.technologiesUsed} onChange={(e) => setProjectForm({ ...projectForm, technologiesUsed: e.target.value })} placeholder="React, Node.js, MongoDB" />
          </div>

          {/* Project Challenges */}
          <div>
            <label className={labelClass}>Project Challenges (comma separated)</label>
            <textarea className={inputClass} rows={2} value={projectForm.projectChallenges} onChange={(e) => setProjectForm({ ...projectForm, projectChallenges: e.target.value })} placeholder="Tight deadline, Complex integrations" />
          </div>

          {/* Project Solutions */}
          <div>
            <label className={labelClass}>Project Solutions (comma separated)</label>
            <textarea className={inputClass} rows={2} value={projectForm.projectSolutions} onChange={(e) => setProjectForm({ ...projectForm, projectSolutions: e.target.value })} placeholder="Agile methodology, Custom API development" />
          </div>

          {/* Project Results */}
          <div>
            <label className={labelClass}>Project Results (comma separated)</label>
            <textarea className={inputClass} rows={2} value={projectForm.projectResults} onChange={(e) => setProjectForm({ ...projectForm, projectResults: e.target.value })} placeholder="Increased efficiency by 30%, Improved user engagement" />
          </div>

          {/* SEO Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>SEO Title</label>
              <input className={inputClass} value={projectForm.seoTitle} onChange={(e) => setProjectForm({ ...projectForm, seoTitle: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>SEO Description</label>
              <input className={inputClass} value={projectForm.seoDescription} onChange={(e) => setProjectForm({ ...projectForm, seoDescription: e.target.value })} />
            </div>
          </div>

          {/* Settings row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" checked={projectForm.featured} onChange={(e) => setProjectForm({ ...projectForm, featured: e.target.checked })} className="rounded border-gray-300 dark:border-gray-600 w-4 h-4" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Featured</label>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select className={inputClass} value={projectForm.status} onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value as 'draft' | 'published' | 'archived' })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Display Order</label>
              <input type="number" className={inputClass} value={projectForm.displayOrder} onChange={(e) => setProjectForm({ ...projectForm, displayOrder: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" checked={projectForm.isActive} onChange={(e) => setProjectForm({ ...projectForm, isActive: e.target.checked })} className="rounded border-gray-300 dark:border-gray-600 w-4 h-4" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => { setProjectsModalOpen(false); resetProjectForm(); }} className={btnSecondary}>Cancel</button>
            <button type="submit" className={btnPrimary} disabled={saveProjectMutation.isPending}>
              {editingProject ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    ),
  });

  // ---------- Testimonials Tab ----------
  const renderTestimonialsTab = () => renderCRUDTab<Testimonial>({
    data: testimonialsData?.data || [],
    loading: testimLoading,
    columns: testimColumns,
    onEdit: openTestimonialModal,
    onDelete: (id) => deleteTestimonialMutation.mutate(id),
    onCreateLabel: 'New Testimonial',
    onOpenCreate: () => openTestimonialModal(),
    modal: (
      <Modal isOpen={testimonialsModalOpen} onClose={() => { setTestimonialsModalOpen(false); resetTestimonialForm(); }} title={editingTestimonial ? 'Edit Testimonial' : 'New Testimonial'} size="md">
        <form onSubmit={handleTestimonialSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className={labelClass}>Client Name *</label>
            <input className={inputClass} value={testimonialForm.clientName} onChange={(e) => setTestimonialForm({ ...testimonialForm, clientName: e.target.value })} required />
          </div>
          <div>
            <label className={labelClass}>Client Title</label>
            <input className={inputClass} value={testimonialForm.clientTitle} onChange={(e) => setTestimonialForm({ ...testimonialForm, clientTitle: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Testimonial Text *</label>
            <textarea className={inputClass} rows={4} value={testimonialForm.testimonialText} onChange={(e) => setTestimonialForm({ ...testimonialForm, testimonialText: e.target.value })} required />
          </div>
          <div>
            <label className={labelClass}>Rating (1-5)</label>
            <input type="number" min={1} max={5} className={inputClass} value={testimonialForm.rating} onChange={(e) => setTestimonialForm({ ...testimonialForm, rating: parseInt(e.target.value) || 5 })} />
          </div>

          {/* Image Upload Section */}
          <div className="space-y-2">
            <label className={labelClass}>Client Image</label>
            {testimonialForm.image && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 mb-2 group">
                <img src={testimonialForm.image.secure_url} alt="Client" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setTestimonialForm({ ...testimonialForm, image: null })} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </div>
            )}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
              <CloudArrowUpIcon className="h-6 w-6 mx-auto text-gray-400 mb-1" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Upload testimonial image</p>
              <input
                ref={testimonialImageInputRef}
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingTestimonialImage(true);
                  try {
                    const result = await uploadToCloudinary(file);
                    setTestimonialForm({ ...testimonialForm, image: { secure_url: result.secure_url, public_id: result.public_id } });
                    toast.success('Image uploaded');
                  } catch (err: any) {
                    toast.error(err.message || 'Image upload failed');
                  } finally {
                    setUploadingTestimonialImage(false);
                    if (testimonialImageInputRef.current) testimonialImageInputRef.current.value = '';
                  }
                }}
                disabled={uploadingTestimonialImage}
                className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {uploadingTestimonialImage && <p className="text-xs text-indigo-600 mt-1">Uploading to Cloudinary...</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" checked={testimonialForm.featured} onChange={(e) => setTestimonialForm({ ...testimonialForm, featured: e.target.checked })} className="rounded border-gray-300 dark:border-gray-600 w-4 h-4" />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Featured</label>
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select className={inputClass} value={testimonialForm.status} onChange={(e) => setTestimonialForm({ ...testimonialForm, status: e.target.value as 'pending' | 'approved' | 'rejected' })}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => { setTestimonialsModalOpen(false); resetTestimonialForm(); }} className={btnSecondary}>Cancel</button>
            <button type="submit" className={btnPrimary} disabled={saveTestimonialMutation.isPending}>
              {saveTestimonialMutation.isPending ? 'Saving...' : editingTestimonial ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    ),
  });

  // ---------- Partners Tab ----------
  const renderPartnersTab = () => renderCRUDTab<Partner>({
    data: partnersData?.data || [],
    loading: partLoading,
    columns: partnerColumns,
    onEdit: openPartnerModal,
    onDelete: (id) => deletePartnerMutation.mutate(id),
    onCreateLabel: 'New Partner',
    onOpenCreate: () => openPartnerModal(),
    modal: (
      <Modal isOpen={partnersModalOpen} onClose={() => { setPartnersModalOpen(false); resetPartnerForm(); }} title={editingPartner ? 'Edit Partner' : 'New Partner'} size="md">
        <form onSubmit={handlePartnerSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Company Name</label>
            <input className={inputClass} value={partnerForm.name} onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })} required />
          </div>
          <div>
            <label className={labelClass}>Logo URL</label>
            <input className={inputClass} value={partnerForm.logo} onChange={(e) => setPartnerForm({ ...partnerForm, logo: e.target.value })} placeholder="https://..." />
          </div>
          <div>
            <label className={labelClass}>Website</label>
            <input className={inputClass} value={partnerForm.website} onChange={(e) => setPartnerForm({ ...partnerForm, website: e.target.value })} placeholder="https://..." />
          </div>
          <div>
            <label className={labelClass}>Order</label>
            <input type="number" className={inputClass} value={partnerForm.order} onChange={(e) => setPartnerForm({ ...partnerForm, order: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setPartnersModalOpen(false); resetPartnerForm(); }} className={btnSecondary}>Cancel</button>
            <button type="submit" className={btnPrimary}>{editingPartner ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    ),
  });

  // ---------- Main render ----------
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Management</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage all your website content in one place</p>
      </div>

      {renderTabNav()}

      {activeTab === 'homepage' && renderHomepageTab()}
      {activeTab === 'blog' && renderBlogTab()}
      {activeTab === 'services' && renderServicesTab()}
      {/* {activeTab === 'projects' && renderProjectsTab()} */}
      {activeTab === 'testimonials' && renderTestimonialsTab()}
      {/* {activeTab === 'partners' && renderPartnersTab()} */}
    </div>
  );
};

export default ContentPage;
