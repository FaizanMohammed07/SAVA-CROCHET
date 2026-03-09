import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useAnalytics } from "@/hooks/useAdmin";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type AnalyticsType = "sales" | "products" | "customers" | "revenue";

const Analytics = () => {
  const [type, setType] = useState<AnalyticsType>("sales");
  const [period, setPeriod] = useState("30d");

  const { data, isLoading } = useAnalytics(type, { period });
  const analytics = data?.data;

  return (
    <div className="space-y-6">
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-display text-3xl text-foreground"
      >
        Analytics
      </motion.h1>

      <div className="flex flex-wrap gap-3">
        <Select value={type} onValueChange={(v) => setType(v as AnalyticsType)}>
          <SelectTrigger className="w-40 rounded-xl font-body">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sales">Sales</SelectItem>
            <SelectItem value="products">Products</SelectItem>
            <SelectItem value="customers">Customers</SelectItem>
            <SelectItem value="revenue">Revenue</SelectItem>
          </SelectContent>
        </Select>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36 rounded-xl font-body">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="365d">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-warm-brown" />
        </div>
      ) : !analytics ? (
        <p className="text-muted-foreground font-body text-center py-10">
          No analytics data available
        </p>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          {analytics.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(analytics.summary).map(([label, value]) => (
                <div
                  key={label}
                  className="bg-card rounded-2xl p-4 border border-border"
                >
                  <p className="text-xs font-body text-muted-foreground capitalize mb-1">
                    {label.replace(/([A-Z])/g, " $1")}
                  </p>
                  <p className="font-display text-xl text-foreground">
                    {typeof value === "number"
                      ? label.toLowerCase().includes("revenue") ||
                        label.toLowerCase().includes("amount")
                        ? `₹${value.toLocaleString()}`
                        : value.toLocaleString()
                      : String(value)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Chart */}
          {analytics.chartData && analytics.chartData.length > 0 && (
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="font-display text-lg text-foreground mb-4 capitalize">
                {type} Over Time
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                {type === "revenue" ? (
                  <AreaChart data={analytics.chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(30,15%,88%)"
                    />
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
                    />
                    <Legend
                      wrapperStyle={{ fontFamily: "Outfit", fontSize: 12 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(25,30%,38%)"
                      fill="hsl(25,30%,38%)"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  </AreaChart>
                ) : type === "sales" ? (
                  <BarChart data={analytics.chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(30,15%,88%)"
                    />
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
                    />
                    <Legend
                      wrapperStyle={{ fontFamily: "Outfit", fontSize: 12 }}
                    />
                    <Bar
                      dataKey="orders"
                      fill="hsl(140,18%,72%)"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="amount"
                      fill="hsl(25,30%,38%)"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                ) : (
                  <LineChart data={analytics.chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(30,15%,88%)"
                    />
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
                    />
                    <Legend
                      wrapperStyle={{ fontFamily: "Outfit", fontSize: 12 }}
                    />
                    {Object.keys(analytics.chartData[0] || {})
                      .filter((k) => k !== "date")
                      .map((key, i) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          stroke={
                            [
                              "hsl(25,30%,38%)",
                              "hsl(140,18%,72%)",
                              "hsl(350,30%,80%)",
                            ][i % 3]
                          }
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Items */}
          {analytics.topItems && analytics.topItems.length > 0 && (
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="font-display text-lg text-foreground mb-4">
                {type === "products"
                  ? "Top Products"
                  : type === "customers"
                    ? "Top Customers"
                    : "Top Items"}
              </h3>
              <div className="space-y-3">
                {analytics.topItems
                  .slice(0, 10)
                  .map((item: Record<string, unknown>, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center text-xs font-body text-muted-foreground">
                          {i + 1}
                        </span>
                        <span className="text-sm font-body font-medium">
                          {String(item.name || item.email || `Item ${i + 1}`)}
                        </span>
                      </div>
                      <span className="text-sm font-body text-muted-foreground">
                        {item.totalRevenue != null
                          ? `₹${item.totalRevenue.toLocaleString()}`
                          : item.count != null
                            ? `${item.count} orders`
                            : ""}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Analytics;
