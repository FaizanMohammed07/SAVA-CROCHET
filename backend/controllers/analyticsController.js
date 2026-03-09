const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const analyticsService = require("../services/analyticsService");

// ─── Helper: parse "30d", "7d", "90d", "365d" → number ────
function parsePeriodDays(period) {
  if (!period) return 30;
  const match = period.match(/^(\d+)d$/);
  return match ? parseInt(match[1], 10) : parseInt(period, 10) || 30;
}

// ─── DASHBOARD OVERVIEW ────────────────────────────────────
exports.getDashboard = asyncHandler(async (req, res) => {
  const overview = await analyticsService.getDashboardOverview();
  return ApiResponse.success(res, overview);
});

// ─── REVENUE ANALYTICS ─────────────────────────────────────
exports.getRevenueAnalytics = asyncHandler(async (req, res) => {
  const days =
    parseInt(req.query.days, 10) || parsePeriodDays(req.query.period);
  const chartData = await analyticsService.getRevenueAnalytics(days);

  // Calculate summary
  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = chartData.reduce((sum, d) => sum + d.orders, 0);
  const avgOrderValue =
    totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  return ApiResponse.success(res, {
    summary: {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      period: `${days} days`,
    },
    chartData,
    topItems: [],
  });
});

// ─── SALES ANALYTICS ───────────────────────────────────────
exports.getSalesAnalytics = asyncHandler(async (req, res) => {
  const days = parsePeriodDays(req.query.period);
  const [chartData, categorySales, topProducts] = await Promise.all([
    analyticsService.getRevenueAnalytics(days),
    analyticsService.getCategorySales(),
    analyticsService.getMostSoldProducts(10),
  ]);

  const totalSales = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = chartData.reduce((sum, d) => sum + d.orders, 0);

  return ApiResponse.success(res, {
    summary: {
      totalSales,
      totalOrders,
      avgOrderValue: totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0,
      topCategory: categorySales[0]?.category || "N/A",
    },
    chartData: chartData.map((d) => ({
      date: d.date,
      orders: d.orders,
      amount: d.revenue,
    })),
    topItems: topProducts.map((p) => ({
      name: p.productName,
      count: p.sold,
      totalRevenue: p.sold * (p.discountPrice || p.price),
    })),
  });
});

// ─── PRODUCTS ANALYTICS ────────────────────────────────────
exports.getProductsAnalytics = asyncHandler(async (req, res) => {
  const [mostSold, mostViewed, categorySales] = await Promise.all([
    analyticsService.getMostSoldProducts(10),
    analyticsService.getMostViewedProducts(10),
    analyticsService.getCategorySales(),
  ]);

  const totalSold = mostSold.reduce((sum, p) => sum + p.sold, 0);
  const totalViews = mostViewed.reduce((sum, p) => sum + p.views, 0);

  return ApiResponse.success(res, {
    summary: {
      totalProductsSold: totalSold,
      totalViews,
      topCategory: categorySales[0]?.category || "N/A",
      categories: categorySales.length,
    },
    chartData: categorySales.map((c) => ({
      date: c.category,
      sales: c.totalSales,
      quantity: c.totalQuantity,
    })),
    topItems: mostSold.map((p) => ({
      name: p.productName,
      count: p.sold,
      totalRevenue: p.sold * (p.discountPrice || p.price),
    })),
  });
});

// ─── CUSTOMERS ANALYTICS ───────────────────────────────────
exports.getCustomersAnalytics = asyncHandler(async (req, res) => {
  const days = parsePeriodDays(req.query.period);
  const [userTrend, returningStats] = await Promise.all([
    analyticsService.getUserRegistrationTrend(days),
    analyticsService.getReturningCustomerStats(),
  ]);

  return ApiResponse.success(res, {
    summary: {
      totalCustomers: returningStats.totalCustomers,
      repeatCustomers: returningStats.repeatCustomers,
      repeatRate: `${returningStats.repeatRate}%`,
      newCustomers: userTrend.reduce((sum, d) => sum + d.count, 0),
    },
    chartData: userTrend.map((d) => ({
      date: d.date,
      newCustomers: d.count,
    })),
    topItems: [],
  });
});

// ─── MOST SOLD PRODUCTS ────────────────────────────────────
exports.getMostSoldProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const products = await analyticsService.getMostSoldProducts(limit);
  return ApiResponse.success(res, { products });
});

// ─── ORDER STATUS DISTRIBUTION ─────────────────────────────
exports.getOrderStatusDistribution = asyncHandler(async (req, res) => {
  const distribution = await analyticsService.getOrderStatusDistribution();
  return ApiResponse.success(res, { distribution });
});

// ─── USER REGISTRATION TREND ───────────────────────────────
exports.getUserRegistrationTrend = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days, 10) || 30;
  const data = await analyticsService.getUserRegistrationTrend(days);
  return ApiResponse.success(res, data);
});

// ─── CATEGORY-WISE SALES ──────────────────────────────────
exports.getCategorySales = asyncHandler(async (req, res) => {
  const data = await analyticsService.getCategorySales();
  return ApiResponse.success(res, data);
});

// ─── VISITOR STATISTICS ────────────────────────────────────
exports.getVisitorStats = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days, 10) || 7;
  const stats = await analyticsService.getVisitorStats(days);
  return ApiResponse.success(res, stats);
});

// ─── MOST VIEWED PRODUCTS ──────────────────────────────────
exports.getMostViewedProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const products = await analyticsService.getMostViewedProducts(limit);
  return ApiResponse.success(res, { products });
});

// ─── RETURNING CUSTOMER STATS ──────────────────────────────
exports.getReturningCustomerStats = asyncHandler(async (req, res) => {
  const data = await analyticsService.getReturningCustomerStats();
  return ApiResponse.success(res, data);
});
