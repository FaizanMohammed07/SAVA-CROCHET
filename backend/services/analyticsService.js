const mongoose = require("mongoose");
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const Visitor = require("../models/Visitor");
const Payment = require("../models/Payment");
const cacheService = require("./cacheService");
const { CACHE_TTL } = require("../utils/constants");

class AnalyticsService {
  /**
   * Get dashboard overview
   */
  async getDashboardOverview() {
    const cacheKey = "analytics:dashboard";
    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const now = new Date();
        const todayStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [
          totalUsers,
          totalOrders,
          totalRevenue,
          todayOrders,
          todayRevenue,
          monthlyRevenue,
          activeProducts,
          lowStockProducts,
          revenueChartRaw,
          orderStatusRaw,
          recentOrders,
        ] = await Promise.all([
          User.countDocuments({ role: "user" }),
          Order.countDocuments(),
          Order.aggregate([
            { $match: { "paymentInfo.status": "paid" } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
          ]),
          Order.countDocuments({ createdAt: { $gte: todayStart } }),
          Order.aggregate([
            {
              $match: {
                createdAt: { $gte: todayStart },
                "paymentInfo.status": "paid",
              },
            },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
          ]),
          Order.aggregate([
            {
              $match: {
                createdAt: { $gte: monthStart },
                "paymentInfo.status": "paid",
              },
            },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
          ]),
          Product.countDocuments({ isActive: true }),
          Product.countDocuments({
            isActive: true,
            stock: { $lte: 5, $gt: 0 },
          }),
          // Revenue chart (last 30 days)
          Order.aggregate([
            {
              $match: {
                createdAt: { $gte: thirtyDaysAgo },
                "paymentInfo.status": "paid",
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                revenue: { $sum: "$totalAmount" },
              },
            },
            { $sort: { _id: 1 } },
            { $project: { date: "$_id", revenue: 1, _id: 0 } },
          ]),
          // Order status distribution
          Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
          // Recent orders
          Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select("orderNumber status totalAmount createdAt")
            .lean(),
        ]);

        // Convert order status array to { status: count } map
        const orderStatusDistribution = {};
        for (const item of orderStatusRaw) {
          orderStatusDistribution[item._id] = item.count;
        }

        return {
          totalUsers,
          totalCustomers: totalUsers,
          totalOrders,
          totalRevenue: totalRevenue[0]?.total || 0,
          totalProducts: activeProducts,
          todayOrders,
          todayRevenue: todayRevenue[0]?.total || 0,
          monthlyRevenue: monthlyRevenue[0]?.total || 0,
          activeProducts,
          lowStockProducts,
          revenueChart: revenueChartRaw,
          orderStatusDistribution,
          recentOrders,
        };
      },
      CACHE_TTL.ANALYTICS,
    );
  }

  /**
   * Get revenue analytics (daily for last 30 days)
   */
  async getRevenueAnalytics(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          "paymentInfo.status": "paid",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: "$_id",
          revenue: 1,
          orders: 1,
          _id: 0,
        },
      },
    ]);
  }

  /**
   * Get most sold products
   */
  async getMostSoldProducts(limit = 10) {
    return Product.find({ isActive: true })
      .sort({ sold: -1 })
      .limit(limit)
      .select(
        "productName slug images price discountPrice sold rating category",
      );
  }

  /**
   * Get order status distribution
   */
  async getOrderStatusDistribution() {
    return Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { status: "$_id", count: 1, _id: 0 } },
    ]);
  }

  /**
   * Get user registration trend
   */
  async getUserRegistrationTrend(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return User.aggregate([
      { $match: { createdAt: { $gte: startDate }, role: "user" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: "$_id", count: 1, _id: 0 } },
    ]);
  }

  /**
   * Get category-wise sales
   */
  async getCategorySales() {
    return Order.aggregate([
      { $match: { "paymentInfo.status": "paid" } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $group: {
          _id: "$productInfo.category",
          totalSales: { $sum: "$items.totalPrice" },
          totalQuantity: { $sum: "$items.quantity" },
        },
      },
      {
        $project: {
          category: "$_id",
          totalSales: 1,
          totalQuantity: 1,
          _id: 0,
        },
      },
      { $sort: { totalSales: -1 } },
    ]);
  }

  /**
   * Get visitor statistics
   */
  async getVisitorStats(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [dailyVisitors, deviceBreakdown, conversionRate, topPages] =
      await Promise.all([
        Visitor.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              visitors: { $sum: 1 },
              uniqueIPs: { $addToSet: "$ip" },
              returning: { $sum: { $cond: ["$isReturning", 1, 0] } },
            },
          },
          {
            $project: {
              date: "$_id",
              visitors: 1,
              uniqueVisitors: { $size: "$uniqueIPs" },
              returning: 1,
              _id: 0,
            },
          },
          { $sort: { date: 1 } },
        ]),

        Visitor.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          { $group: { _id: "$deviceType", count: { $sum: 1 } } },
          { $project: { device: "$_id", count: 1, _id: 0 } },
        ]),

        Visitor.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              purchases: {
                $sum: {
                  $cond: [{ $eq: ["$conversionEvent", "purchase"] }, 1, 0],
                },
              },
              signups: {
                $sum: {
                  $cond: [{ $eq: ["$conversionEvent", "signup"] }, 1, 0],
                },
              },
              addToCarts: {
                $sum: {
                  $cond: [{ $eq: ["$conversionEvent", "add_to_cart"] }, 1, 0],
                },
              },
            },
          },
        ]),

        Visitor.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          { $unwind: "$pagesVisited" },
          { $group: { _id: "$pagesVisited.path", views: { $sum: 1 } } },
          { $sort: { views: -1 } },
          { $limit: 10 },
          { $project: { path: "$_id", views: 1, _id: 0 } },
        ]),
      ]);

    const conversion = conversionRate[0] || {
      total: 0,
      purchases: 0,
      signups: 0,
      addToCarts: 0,
    };

    return {
      dailyVisitors,
      deviceBreakdown,
      conversionRate: {
        totalVisitors: conversion.total,
        purchases: conversion.purchases,
        signups: conversion.signups,
        addToCarts: conversion.addToCarts,
        purchaseRate: conversion.total
          ? ((conversion.purchases / conversion.total) * 100).toFixed(2)
          : 0,
      },
      topPages,
    };
  }

  /**
   * Get most viewed products
   */
  async getMostViewedProducts(limit = 10) {
    return Product.find({ isActive: true })
      .sort({ views: -1 })
      .limit(limit)
      .select("productName slug images price views rating");
  }

  /**
   * Get returning customer stats
   */
  async getReturningCustomerStats() {
    const totalCustomers = await User.countDocuments({ role: "user" });
    const repeatCustomers = await Order.aggregate([
      { $group: { _id: "$user", orderCount: { $sum: 1 } } },
      { $match: { orderCount: { $gt: 1 } } },
      { $count: "total" },
    ]);

    return {
      totalCustomers,
      repeatCustomers: repeatCustomers[0]?.total || 0,
      repeatRate: totalCustomers
        ? (((repeatCustomers[0]?.total || 0) / totalCustomers) * 100).toFixed(2)
        : 0,
    };
  }
}

module.exports = new AnalyticsService();
