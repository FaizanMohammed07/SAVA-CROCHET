import { motion } from "framer-motion";
import { Loader2, DollarSign, ShoppingBag, Users, Package } from "lucide-react";
import { useAdminDashboard } from "@/hooks/useAdmin";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Link } from "react-router-dom";

const COLORS = [
  "hsl(25,30%,38%)",
  "hsl(140,18%,72%)",
  "hsl(350,30%,80%)",
  "hsl(20,50%,88%)",
  "hsl(38,40%,94%)",
  "hsl(0,84%,60%)",
];

const Dashboard = () => {
  const { data, isLoading } = useAdminDashboard();
  const stats = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-warm-brown" />
      </div>
    );
  }

  const cards = [
    {
      label: "Revenue",
      value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "bg-sage/20 text-sage",
    },
    {
      label: "Orders",
      value: stats?.totalOrders || 0,
      icon: ShoppingBag,
      color: "bg-dusty-pink/20 text-dusty-pink",
    },
    {
      label: "Customers",
      value: stats?.totalCustomers || 0,
      icon: Users,
      color: "bg-peach/40 text-warm-brown",
    },
    {
      label: "Products",
      value: stats?.totalProducts || 0,
      icon: Package,
      color: "bg-cream text-warm-brown",
    },
  ];

  const revenueChart = stats?.revenueChart || [];
  const orderStatusData = stats?.orderStatusDistribution
    ? Object.entries(stats.orderStatusDistribution).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  return (
    <div className="space-y-8">
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-display text-3xl text-foreground"
      >
        Dashboard
      </motion.h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-5 border border-border"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-body text-muted-foreground">
                {card.label}
              </span>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}
              >
                <card.icon size={20} />
              </div>
            </div>
            <p className="font-display text-2xl text-foreground">
              {card.value}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-card rounded-2xl p-6 border border-border">
          <h3 className="font-display text-lg text-foreground mb-4">Revenue</h3>
          {revenueChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30,15%,88%)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fontFamily: "Outfit" }}
                />
                <YAxis tick={{ fontSize: 12, fontFamily: "Outfit" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid hsl(30,15%,88%)",
                    fontFamily: "Outfit",
                  }}
                  formatter={(value: number) => [
                    `₹${value.toLocaleString()}`,
                    "Revenue",
                  ]}
                />
                <Bar
                  dataKey="revenue"
                  fill="hsl(25,30%,38%)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground font-body text-sm text-center py-10">
              No revenue data yet
            </p>
          )}
        </div>

        {/* Order Status */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="font-display text-lg text-foreground mb-4">
            Order Status
          </h3>
          {orderStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {orderStatusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground font-body text-sm text-center py-10">
              No orders yet
            </p>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      {stats?.recentOrders && stats.recentOrders.length > 0 && (
        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg text-foreground">
              Recent Orders
            </h3>
            <Link
              to="/admin/orders"
              className="text-sm text-primary font-body hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-xs font-body font-medium text-muted-foreground">
                    Order #
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-body font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-body font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-right py-3 px-2 text-xs font-body font-medium text-muted-foreground">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.slice(0, 5).map((order) => (
                  <tr
                    key={order._id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="py-3 px-2 text-sm font-body font-medium">
                      <Link to={`/admin/orders`} className="hover:text-primary">
                        #{order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-2 text-sm font-body text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-xs capitalize font-body">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm font-body text-right font-medium">
                      ₹{order.totalAmount?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
