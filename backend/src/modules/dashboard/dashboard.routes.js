import express from 'express';
import auth from '../../middlewares/auth.middleware.js';
import { getStats } from './dashboard.controller.js';

const router = express.Router();

router.get('/stats', auth(), getStats);

export default router;
