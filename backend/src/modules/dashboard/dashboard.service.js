import Order from '../orders/order.model.js';
import Product from '../products/product.model.js';
import Application from '../applications/application.model.js';

/**
 * Get dashboard statistics.
 * Aggregates data from Orders, Products, and Applications collections.
 */
const getDashboardStats = async () => {
  // ── Order stats ──
  const orders = await Order.find({}).lean();
  const totalOrders = orders.length;

  const totalSalesRevenue = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const pendingOrders = orders.filter((o) => o.orderStatus === 'pending').length;

  // ── Sales per month (last 12 months from paid orders) ──
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const paidOrders = orders.filter(
    (o) => o.paymentStatus === 'paid' && new Date(o.createdAt) >= twelveMonthsAgo
  );

  const salesMap = new Map();
  // Initialise all 12 months
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    salesMap.set(key, { month: label, revenue: 0 });
  }

  paidOrders.forEach((o) => {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (salesMap.has(key)) {
      salesMap.get(key).revenue += o.total || 0;
    }
  });

  const salesPerMonth = Array.from(salesMap.values());

  // ── Orders per week (last 8 weeks) ──
  const ordersPerWeek = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() - i * 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const count = orders.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= weekStart && d < weekEnd;
    }).length;

    const label = `W${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    ordersPerWeek.push({ week: label, count });
  }

  // ── Low stock alerts ──
  const lowStockProducts = await Product.find({ stock: { $lte: 10 } })
    .select('name stock')
    .limit(10)
    .lean();

  const lowStockAlerts = lowStockProducts.map((p) => ({
    productName: p.name,
    currentStock: p.stock,
  }));

  // ── New applications (pending / under_review) ──
  const newApplications = await Application.countDocuments({
    status: { $in: ['pending', 'under_review'] },
  });

  // ── Recent activity (latest 10 orders + applications) ──
  const recentOrders = orders.slice(-5).map((o) => ({
    action: `New order #${o.orderNumber || o._id} — ${o.total ? `${o.total.toLocaleString()} XAF` : 'Pending'}`,
    timestamp: o.createdAt,
    user: o.customerName,
  }));

  const recentApplications = await Application.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .select('firstName lastName createdAt')
    .lean();

  const recentAppActivities = recentApplications.map((a) => ({
    action: `New application from ${a.firstName} ${a.lastName}`,
    timestamp: a.createdAt,
    user: `${a.firstName} ${a.lastName}`,
  }));

  const recentActivity = [...recentOrders, ...recentAppActivities]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  return {
    totalSalesRevenue,
    totalOrders,
    pendingOrders,
    lowStockAlerts,
    newApplications,
    recentActivity,
    salesPerMonth,
    ordersPerWeek,
  };
};

export { getDashboardStats };
