import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Package, ChevronRight } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  out_for_delivery: "bg-cyan-100 text-cyan-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  returned: "bg-orange-100 text-orange-800",
  refunded: "bg-pink-100 text-pink-800",
};

const paymentStatusColors: Record<string, string> = {
  pending: "text-yellow-600",
  paid: "text-green-600",
  failed: "text-red-600",
  refunded: "text-purple-600",
};

const Orders = () => {
  const { data, isLoading } = useOrders();
  const orders = data?.data || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-warm-brown" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-3xl">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-display text-3xl text-foreground mb-8"
        >
          My Orders
        </motion.h1>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Package className="text-muted-foreground" size={28} />
            </div>
            <h2 className="font-display text-xl text-foreground mb-2">
              No orders yet
            </h2>
            <p className="text-muted-foreground font-body mb-4">
              Start shopping to see your orders here
            </p>
            <Link
              to="/shop"
              className="text-primary font-body text-sm hover:underline"
            >
              Browse Collection
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order._id}
                to={`/account/orders/${order._id}`}
                className="block bg-card rounded-2xl p-5 border border-border hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-body text-sm font-medium text-foreground">
                      #{order.orderNumber}
                    </p>
                    <p className="font-body text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-body font-medium px-2.5 py-1 rounded-full capitalize ${statusColors[order.status] || "bg-muted text-foreground"}`}
                    >
                      {order.status?.replace("_", " ")}
                    </span>
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-body text-sm text-muted-foreground">
                      {order.items?.length} item(s)
                    </span>
                    <span
                      className={`text-xs font-body capitalize ${paymentStatusColors[order.paymentInfo?.status] || ""}`}
                    >
                      — {order.paymentInfo?.status}
                    </span>
                  </div>
                  <p className="font-body text-sm font-semibold">
                    ₹{order.totalAmount?.toLocaleString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
