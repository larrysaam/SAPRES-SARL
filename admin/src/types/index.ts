// ============================================================
// SAPRES SARL Admin Dashboard - Shared Types
// ============================================================

export type UserRole = 'super_admin' | 'hr-admin' | 'sales-admin' | 'content-admin' | 'inventory-admin';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  message: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  message: string;
  page: number;
  limit: number;
  totalDocuments: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  page?: number;
  limit?: number;
  totalDocuments?: number;
  totalPages?: number;
}

export interface Asset {
  publicId: string;
  secureUrl: string;
  format: string;
  bytes: number;
}

// Product types
export interface ProductSpecification {
  label: string;
  value: string;
}

export interface ProductCategory {
  _id: string;
  name: string;
  slug: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: ProductCategory;
  sku: string;
  brand: string;
  price: number;
  discountPrice?: number;
  stock: number;
  currency: 'XAF' | 'USD' | 'EUR';
  warranty?: string;
  featured: boolean;
  status: 'draft' | 'published' | 'archived';
  specifications: ProductSpecification[];
  images: Asset[];
  datasheets: Asset[];
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

// Order types
export type OrderStatus = 'pending' | 'processing' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'mtn' | 'orange' | 'whatsapp';

export interface OrderItem {
  product: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

// Payment types
export interface Payment {
  _id: string;
  order: string | Order;
  provider: 'mtn' | 'orange';
  amount: number;
  transactionReference: string;
  providerReference?: string;
  status: 'pending' | 'successful' | 'failed' | 'refunded';
  rawResponse?: any;
  createdAt: string;
  updatedAt: string;
}

// Category types
export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: Asset;
  parentCategory?: string;
  isActive: boolean;
  createdAt: string;
}

// Job types
export interface Job {
  _id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  salaryRange?: string;
  experienceLevel?: string;
  numberOfPositions?: number;
  applicationDeadline: string;
  status: 'draft' | 'open' | 'closed' | 'archived';
  featured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationStatus = 'pending' | 'shortlisted' | 'accepted' | 'rejected';

export interface Application {
  _id: string;
  job: Job | string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cv: Asset;
  idCard?: Asset;
  diplomas?: Asset[];
  coverLetter?: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

// Blog types
export interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: Asset;
  author: string | User;
  tags: string[];
  category: string;
  seoTitle?: string;
  seoDescription?: string;
  status: 'draft' | 'published';
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Testimonial types
export interface Testimonial {
  _id: string;
  clientName: string;
  clientTitle?: string;
  testimonialText: string;
  rating: number;
  image?: Asset;
  featured: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// Partner types
export interface Partner {
  _id: string;
  name: string;
  logo: Asset;
  website?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

// Service types
export interface Service {
  _id: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  image: Asset;
  order: number;
  isActive: boolean;
  createdAt: string;
}

// Project types
export interface Project {
  _id: string;
  title: string;
  slug?: string;
  shortDescription: string;
  description: string;
  client: string;
  projectCategory: string;
  projectType?: string;
  capacity?: string;
  duration?: string;
  completionDate?: string;
  featuredImage?: Asset;
  gallery: Asset[];
  beforeImages: Asset[];
  afterImages: Asset[];
  technologiesUsed: string[];
  projectChallenges: string[];
  projectSolutions: string[];
  projectResults: string[];
  testimonial?: Testimonial;
  featured: boolean;
  status: 'draft' | 'published' | 'archived';
  displayOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Homepage types
export interface HeroSection {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  backgroundImage?: Asset;
  backgroundVideo?: Asset;
}

export interface Banner {
  title: string;
  subtitle: string;
  image: Asset;
  link: string;
  isActive: boolean;
}

export interface Homepage {
  hero: HeroSection;
  banners: Banner[];
  featuredProductIds: string[];
  aboutSection: {
    title: string;
    content: string;
    image?: Asset;
  };
  statsSection: {
    title: string;
    stats: { label: string; value: string; icon: string }[];
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

// Notification types
export interface NotificationTemplate {
  _id: string;
  name: string;
  type: 'email' | 'sms' | 'whatsapp' | 'system';
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Notification {
  _id: string;
  type: 'email' | 'sms' | 'whatsapp' | 'system';
  title: string;
  message: string;
  recipient?: string;
  read: boolean;
  reference?: {
    model: string;
    id: string;
  };
  createdAt: string;
}

// Settings types
export interface CompanyInfo {
  name: string;
  logo?: Asset;
  email: string;
  phone: string;
  address: string;
  website: string;
}

export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
}

export interface SEOSettings {
  title: string;
  description: string;
  keywords: string[];
  googleAnalyticsId?: string;
}

export interface PaymentSettings {
  mtnMoney: { enabled: boolean; merchantCode?: string };
  orangeMoney: { enabled: boolean; merchantCode?: string };
  whatsapp: { enabled: boolean; number?: string };
}

export interface RecruitmentSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  whatsappNotifications: boolean;
  autoReplyEmail: string;
}

export interface Settings {
  company: CompanyInfo;
  social: SocialLinks;
  seo: SEOSettings;
  payments: PaymentSettings;
  recruitment: RecruitmentSettings;
  appearance: {
    primaryColor: string;
    favicon?: Asset;
  };
}

// Dashboard stats types
export interface DashboardStats {
  totalSalesRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  lowStockAlerts: { productName: string; currentStock: number }[];
  newApplications: number;
  recentActivity: {
    action: string;
    timestamp: string;
    user: string;
  }[];
  salesPerMonth: { month: string; revenue: number }[];
  ordersPerWeek: { week: string; count: number }[];
}

// Analytics types
export interface SalesReport {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  bestSellingProducts: { product: Product; quantity: number; revenue: number }[];
  revenueByPeriod: { period: string; revenue: number }[];
}

export interface InventoryReport {
  totalProducts: number;
  totalStock: number;
  lowStockItems: number;
  outOfStockItems: number;
  stockMovements: { product: string; type: 'in' | 'out'; quantity: number; date: string }[];
}

// Log types
export interface ActivityLog {
  _id: string;
  user: string | User;
  action: string;
  module: string;
  description: string;
  ip: string;
  createdAt: string;
}
