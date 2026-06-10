import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import DataTable from '../components/DataTable';
import type { Column } from '../components/DataTable';
import Modal from '../components/Modal';
import Skeleton, { CardSkeleton } from '../components/Skeleton';
import { toast } from '../components/Toast';
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
  { key: 'projects', label: 'Projects' },
  { key: 'testimonials', label: 'Testimonials' },
  { key: 'partners', label: 'Partners' },
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
// Stat item
// ------------------------------------------------------------------
interface StatItem {
  label: string;
  value: string;
  icon: string;
}

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
  const [blogForm, setBlogForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    coverImage: '',
    author: '',
    tags: '',
    category: 'Company News',
    seoTitle: '',
    seoDescription: '',
    status: 'draft' as 'draft' | 'published',
  });

  // ---------- Service state ----------
  const [servicesModalOpen, setServicesModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState({
    title: '',
    description: '',
    icon: '',
    image: '',
    order: 0,
    isActive: true,
  });

  // ---------- Project state ----------
  const [projectsModalOpen, setProjectsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    client: '',
    location: '',
    completionDate: '',
    images: '',
    isActive: true,
  });

  // ---------- Testimonial state ----------
  const [testimonialsModalOpen, setTestimonialsModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [testimonialForm, setTestimonialForm] = useState({
    clientName: '',
    clientTitle: '',
    company: '',
    content: '',
    rating: 5,
    avatar: '',
    isActive: true,
  });

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
    const d = res.data?.data || res.data || [];
    return { data: Array.isArray(d) ? d : d.data || [], totalPages: 1 };
  };

  const fetchProjects = async (): Promise<{ data: Project[]; totalPages: number }> => {
    const { default: apiClient } = await import('../services/apiClient');
    const res = await apiClient.get('/projects?limit=100');
    const d = res.data?.data || res.data || [];
    return { data: Array.isArray(d) ? d : d.data || [], totalPages: 1 };
  };

  const fetchTestimonials = async (): Promise<{ data: Testimonial[]; totalPages: number }> => {
    const { default: apiClient } = await import('../services/apiClient');
    const res = await apiClient.get('/testimonials?limit=100');
    const d = res.data?.data || res.data || [];
    return { data: Array.isArray(d) ? d : d.data || [], totalPages: 1 };
  };

  const fetchPartners = async (): Promise<{ data: Partner[]; totalPages: number }> => {
    const { default: apiClient } = await import('../services/apiClient');
    const res = await apiClient.get('/partners?limit=100');
    const d = res.data?.data || res.data || [];
    return { data: Array.isArray(d) ? d : d.data || [], totalPages: 1 };
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
  const useGenericMutation = (endpoint: string, queryKey: string) =>
    useMutation({
      mutationFn: async (vars: { id?: string; data: any }) => {
        const { default: apiClient } = await import('../services/apiClient');
        if (vars.id) {
          const res = await apiClient.put(`/${endpoint}/${vars.id}`, vars.data);
          return res.data;
        }
        const res = await apiClient.post(`/${endpoint}`, vars.data);
        return res.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        toast.success('Saved successfully');
      },
      onError: (err: any) => toast.error(err?.message || 'Operation failed'),
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

  const saveServiceMutation = useGenericMutation('services', 'services');
  const deleteServiceMutation = deleteGenericMutation('services', 'services');
  const saveProjectMutation = useGenericMutation('projects', 'projects');
  const deleteProjectMutation = deleteGenericMutation('projects', 'projects');
  const saveTestimonialMutation = useGenericMutation('testimonials', 'testimonials');
  const deleteTestimonialMutation = deleteGenericMutation('testimonials', 'testimonials');
  const savePartnerMutation = useGenericMutation('partners', 'partners');
  const deletePartnerMutation = deleteGenericMutation('partners', 'partners');

  // ---------- Form helpers ----------
  const resetBlogForm = () => {
    setEditingBlog(null);
    setBlogForm({ title: '', excerpt: '', content: '', coverImage: '', author: '', tags: '', category: 'Company News', seoTitle: '', seoDescription: '', status: 'draft' });
  };

  const openBlogModal = (blog?: Blog) => {
    if (blog) {
      setEditingBlog(blog);
      setBlogForm({
        title: blog.title,
        excerpt: blog.excerpt,
        content: blog.content,
        coverImage: blog.coverImage?.secureUrl || '',
        author: blog.author,
        tags: blog.tags.join(', '),
        category: blog.category || 'Company News',
        seoTitle: blog.seoTitle || blog.title,
        seoDescription: blog.seoDescription || blog.excerpt,
        status: blog.status || 'draft',
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
      featuredImage: blogForm.coverImage ? { secure_url: blogForm.coverImage, public_id: 'manual', format: 'jpg', bytes: 0 } : undefined,
      author: blogForm.author,
    };
    if (editingBlog) {
      updateBlogMutation.mutate({ id: editingBlog._id, data: payload });
    } else {
      createBlogMutation.mutate(payload);
    }
  };

  const handleServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveServiceMutation.mutate({
      id: editingService?._id,
      data: serviceForm,
    });
    setServicesModalOpen(false);
    resetServiceForm();
  };

  const resetServiceForm = () => {
    setEditingService(null);
    setServiceForm({ title: '', description: '', icon: '', image: '', order: 0, isActive: true });
  };

  const openServiceModal = (svc?: Service) => {
    if (svc) {
      setEditingService(svc);
      setServiceForm({
        title: svc.title,
        description: svc.description,
        icon: svc.icon,
        image: svc.image?.secureUrl || '',
        order: svc.order,
        isActive: svc.isActive,
      });
    } else {
      resetServiceForm();
    }
    setServicesModalOpen(true);
  };

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveProjectMutation.mutate({
      id: editingProject?._id,
      data: projectForm,
    });
    setProjectsModalOpen(false);
    resetProjectForm();
  };

  const resetProjectForm = () => {
    setEditingProject(null);
    setProjectForm({ title: '', description: '', client: '', location: '', completionDate: '', images: '', isActive: true });
  };

  const openProjectModal = (proj?: Project) => {
    if (proj) {
      setEditingProject(proj);
      setProjectForm({
        title: proj.title,
        description: proj.description,
        client: proj.client,
        location: proj.location,
        completionDate: proj.completionDate,
        images: proj.images?.map((i) => i.secureUrl).join(', ') || '',
        isActive: proj.isActive,
      });
    } else {
      resetProjectForm();
    }
    setProjectsModalOpen(true);
  };

  const handleTestimonialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveTestimonialMutation.mutate({
      id: editingTestimonial?._id,
      data: testimonialForm,
    });
    setTestimonialsModalOpen(false);
    resetTestimonialForm();
  };

  const resetTestimonialForm = () => {
    setEditingTestimonial(null);
    setTestimonialForm({
      clientName: '',
      clientTitle: '',
      company: '',
      content: '',
      rating: 5,
      avatar: '',
      isActive: true,
    });
  };

  const openTestimonialModal = (testim?: Testimonial) => {
    if (testim) {
      setEditingTestimonial(testim);
      setTestimonialForm({
        clientName: testim.clientName,
        clientTitle: testim.clientTitle || '',
        company: testim.company || '',
        content: testim.content,
        rating: testim.rating,
        avatar: testim.avatar?.secureUrl || '',
        isActive: testim.isActive,
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
    setPartnersModalOpen(false);
    resetPartnerForm();
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
    { key: 'author', header: 'Author' },
    { key: 'isPublished', header: 'Status', render: (b) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${b.isPublished ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'}`}>
        {b.isPublished ? 'Published' : 'Draft'}
      </span>
    )},
    { key: 'createdAt', header: 'Date', render: (b) => new Date(b.createdAt).toLocaleDateString() },
  ];

  const svcColumns: Column<Service>[] = [
    { key: 'title', header: 'Title', render: (s) => <span className="font-medium">{s.title}</span> },
    { key: 'icon', header: 'Icon' },
    { key: 'order', header: 'Order' },
    { key: 'isActive', header: 'Status', render: (s) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
        {s.isActive ? 'Active' : 'Inactive'}
      </span>
    )},
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
        {t.avatar?.secureUrl && <img src={t.avatar.secureUrl} alt="" className="h-8 w-8 rounded-full object-cover" />}
        <span className="font-medium">{t.clientName}</span>
      </div>
    )},
    { key: 'company', header: 'Company' },
    { key: 'rating', header: 'Rating', render: (t) => <RatingStars rating={t.rating} /> },
    { key: 'isActive', header: 'Status', render: (t) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
        {t.isActive ? 'Active' : 'Inactive'}
      </span>
    )},
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
        error={blogError as string}
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
          <div>
            <label className={labelClass}>Cover Image URL</label>
            <input className={inputClass} value={blogForm.coverImage} onChange={(e) => setBlogForm({ ...blogForm, coverImage: e.target.value })} placeholder="https://..." />
          </div>
          <div>
            <label className={labelClass}>Tags (comma separated)</label>
            <input className={inputClass} value={blogForm.tags} onChange={(e) => setBlogForm({ ...blogForm, tags: e.target.value })} placeholder="tech, business, news" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={blogForm.status === 'published'} onChange={(e) => setBlogForm({ ...blogForm, status: e.target.checked ? 'published' : 'draft' })} className="rounded border-gray-300 dark:border-gray-600" />
            <label className="text-sm text-gray-700 dark:text-gray-300">Published</label>
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
      <Modal isOpen={servicesModalOpen} onClose={() => { setServicesModalOpen(false); resetServiceForm(); }} title={editingService ? 'Edit Service' : 'New Service'} size="md">
        <form onSubmit={handleServiceSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Title</label>
            <input className={inputClass} value={serviceForm.title} onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })} required />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea className={inputClass} rows={3} value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} required />
          </div>
          <div>
            <label className={labelClass}>Icon (CSS class or URL)</label>
            <input className={inputClass} value={serviceForm.icon} onChange={(e) => setServiceForm({ ...serviceForm, icon: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Image URL</label>
            <input className={inputClass} value={serviceForm.image} onChange={(e) => setServiceForm({ ...serviceForm, image: e.target.value })} placeholder="https://..." />
          </div>
          <div>
            <label className={labelClass}>Order</label>
            <input type="number" className={inputClass} value={serviceForm.order} onChange={(e) => setServiceForm({ ...serviceForm, order: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={serviceForm.isActive} onChange={(e) => setServiceForm({ ...serviceForm, isActive: e.target.checked })} className="rounded border-gray-300 dark:border-gray-600" />
            <label className="text-sm text-gray-700 dark:text-gray-300">Active</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setServicesModalOpen(false); resetServiceForm(); }} className={btnSecondary}>Cancel</button>
            <button type="submit" className={btnPrimary}>{editingService ? 'Update' : 'Create'}</button>
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
      <Modal isOpen={projectsModalOpen} onClose={() => { setProjectsModalOpen(false); resetProjectForm(); }} title={editingProject ? 'Edit Project' : 'New Project'} size="lg">
        <form onSubmit={handleProjectSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Title</label>
            <input className={inputClass} value={projectForm.title} onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} required />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea className={inputClass} rows={4} value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} required />
          </div>
          <div>
            <label className={labelClass}>Client</label>
            <input className={inputClass} value={projectForm.client} onChange={(e) => setProjectForm({ ...projectForm, client: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Location</label>
            <input className={inputClass} value={projectForm.location} onChange={(e) => setProjectForm({ ...projectForm, location: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Completion Date</label>
            <input type="date" className={inputClass} value={projectForm.completionDate} onChange={(e) => setProjectForm({ ...projectForm, completionDate: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Image URLs (comma separated)</label>
            <input className={inputClass} value={projectForm.images} onChange={(e) => setProjectForm({ ...projectForm, images: e.target.value })} placeholder="https://..., https://..." />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={projectForm.isActive} onChange={(e) => setProjectForm({ ...projectForm, isActive: e.target.checked })} className="rounded border-gray-300 dark:border-gray-600" />
            <label className="text-sm text-gray-700 dark:text-gray-300">Active</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setProjectsModalOpen(false); resetProjectForm(); }} className={btnSecondary}>Cancel</button>
            <button type="submit" className={btnPrimary}>{editingProject ? 'Update' : 'Create'}</button>
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
        <form onSubmit={handleTestimonialSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Client Name</label>
            <input className={inputClass} value={testimonialForm.clientName} onChange={(e) => setTestimonialForm({ ...testimonialForm, clientName: e.target.value })} required />
          </div>
          <div>
            <label className={labelClass}>Client Title</label>
            <input className={inputClass} value={testimonialForm.clientTitle} onChange={(e) => setTestimonialForm({ ...testimonialForm, clientTitle: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Company</label>
            <input className={inputClass} value={testimonialForm.company} onChange={(e) => setTestimonialForm({ ...testimonialForm, company: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Content</label>
            <textarea className={inputClass} rows={4} value={testimonialForm.content} onChange={(e) => setTestimonialForm({ ...testimonialForm, content: e.target.value })} required />
          </div>
          <div>
            <label className={labelClass}>Rating (1-5)</label>
            <input type="number" min={1} max={5} className={inputClass} value={testimonialForm.rating} onChange={(e) => setTestimonialForm({ ...testimonialForm, rating: parseInt(e.target.value) || 5 })} />
          </div>
          <div>
            <label className={labelClass}>Avatar URL</label>
            <input className={inputClass} value={testimonialForm.avatar} onChange={(e) => setTestimonialForm({ ...testimonialForm, avatar: e.target.value })} placeholder="https://..." />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={testimonialForm.isActive} onChange={(e) => setTestimonialForm({ ...testimonialForm, isActive: e.target.checked })} className="rounded border-gray-300 dark:border-gray-600" />
            <label className="text-sm text-gray-700 dark:text-gray-300">Active</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setTestimonialsModalOpen(false); resetTestimonialForm(); }} className={btnSecondary}>Cancel</button>
            <button type="submit" className={btnPrimary}>{editingTestimonial ? 'Update' : 'Create'}</button>
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
      {activeTab === 'projects' && renderProjectsTab()}
      {activeTab === 'testimonials' && renderTestimonialsTab()}
      {activeTab === 'partners' && renderPartnersTab()}
    </div>
  );
};

export default ContentPage;
