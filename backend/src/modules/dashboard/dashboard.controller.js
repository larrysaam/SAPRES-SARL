import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { getDashboardStats } from './dashboard.service.js';

/**
 * GET /dashboard/stats
 * Returns aggregated dashboard statistics.
 */
const getStats = asyncHandler(async (req, res) => {
  const stats = await getDashboardStats();
  res.status(200).json(new ApiResponse(200, stats, 'Dashboard stats retrieved successfully'));
});

export { getStats };
