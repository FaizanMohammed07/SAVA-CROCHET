import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import { useOrder } from "@/hooks/useOrders";

const OrderSuccess = () => {
  const { id } = useParams<{ id: string }>();
  const { data: orderData } = useOrder(id!);
  const order = orderData?.data?.order;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-sage/20 flex items-center justify-center">
          <CheckCircle className="text-sage" size={40} />
        </div>
        <h1 className="font-display text-3xl text-foreground mb-3">
          Order Placed!
        </h1>
        <p className="text-muted-foreground font-body mb-2">
          Thank you for your order. We'll start crafting your items with love.
        </p>
        {order && (
          <p className="text-sm text-muted-foreground font-body mb-8">
            Order #{order.orderNumber} — ₹{order.totalAmount?.toLocaleString()}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={`/account/orders/${id}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-body text-sm font-medium hover:opacity-90 transition"
          >
            <Package size={16} /> Track Order
          </Link>
          <Link
            to="/shop"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border font-body text-sm hover:bg-muted transition"
          >
            Continue Shopping <ArrowRight size={16} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderSuccess;
