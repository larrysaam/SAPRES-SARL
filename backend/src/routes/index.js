import express from 'express';

const router = express.Router();

// import feature routes
import authRoutes from '../modules/auth/auth.routes.js';
import userRoutes from '../modules/users/user.routes.js';
import productRoutes from '../modules/products/product.routes.js';
import categoryRoutes from '../modules/categories/category.routes.js';
import serviceRoutes from '../modules/services/service.routes.js';
import projectRoutes from '../modules/projects/project.routes.js';
import jobRoutes from '../modules/jobs/job.routes.js';
import applicationRoutes from '../modules/applications/application.routes.js';
import blogRoutes from '../modules/blogs/blog.routes.js';
import testimonialRoutes from '../modules/testimonials/testimonial.routes.js';
import contactRoutes from '../modules/contacts/contact.routes.js';
// import quoteRoutes from '../modules/quotes/quote.routes.js';
import orderRoutes from '../modules/orders/order.routes.js';
// import paymentRoutes from '../modules/payments/payment.routes.js';
// import homepageRoutes from '../modules/homepage/homepage.routes.js';
// import settingRoutes from '../modules/settings/setting.routes.js';

// mount feature routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/services', serviceRoutes);
router.use('/projects', projectRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/blogs', blogRoutes);
router.use('/testimonials', testimonialRoutes);
router.use('/contacts', contactRoutes);
// router.use('/quotes', quoteRoutes);
// router.use('/orders', orderRoutes);
// router.use('/payments', paymentRoutes);
// router.use('/homepage', homepageRoutes);
// router.use('/settings', settingRoutes);

export default router;
