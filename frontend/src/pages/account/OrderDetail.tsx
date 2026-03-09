import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, MapPin, Truck, CheckCircle } from "lucide-react";
import { useOrder, useCancelOrder } from "@/hooks/useOrders";
import { toast } from "sonner";

const steps = ["pending", "confirmed", "processing", "shipped", "delivered"];

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useOrder(id!);
  const cancelOrder = useCancelOrder();
  const order = data?.data?.order;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-warm-brown" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground font-body">Order not found</p>
      </div>
    );
  }

  const currentStep = steps.indexOf(order.status);

  const handleCancel = () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    cancelOrder.mutate(
      { orderId: order._id },
      {
        onSuccess: () => toast.success("Order cancelled"),
        onError: () => toast.error("Failed to cancel order"),
      },
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-3xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-primary font-body mb-6 hover:underline"
        >
          <ArrowLeft size={16} /> Back to Orders
        </button>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl text-foreground">
                Order #{order.orderNumber}
              </h1>
              <p className="text-sm text-muted-foreground font-body">
                Placed on{" "}
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            {["pending", "confirmed"].includes(order.status) && (
              <button
                onClick={handleCancel}
                disabled={cancelOrder.isPending}
                className="px-4 py-2 rounded-xl border border-destructive text-destructive font-body text-sm hover:bg-destructive/10 disabled:opacity-60 transition"
              >
                Cancel Order
              </button>
            )}
          </div>

          {/* Tracking */}
          {order.status !== "cancelled" && (
            <div className="bg-card rounded-2xl p-6 border border-border mb-6">
              <h3 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
                <Truck size={18} /> Order Tracking
              </h3>
              <div className="flex items-center justify-between">
                {steps.map((step, i) => (
                  <div key={step} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium mb-2 ${
                        i <= currentStep
                          ? "bg-sage text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i <= currentStep ? <CheckCircle size={16} /> : i + 1}
                    </div>
                    <span className="text-xs font-body text-muted-foreground capitalize text-center">
                      {step}
                    </span>
                    {i < steps.length - 1 && (
                      <div
                        className={`hidden sm:block absolute h-0.5 w-full ${i < currentStep ? "bg-sage" : "bg-muted"}`}
                      />
                    )}
                  </div>
                ))}
              </div>
              {order.trackingNumber && (
                <p className="text-sm font-body text-muted-foreground mt-4">
                  Tracking:{" "}
                  <span className="text-foreground font-medium">
                    {order.trackingNumber}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Items */}
          <div className="bg-card rounded-2xl p-6 border border-border mb-6">
            <h3 className="font-display text-lg text-foreground mb-4">Items</h3>
            <div className="space-y-4">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-body text-sm font-medium text-foreground">
                      {item.productName}
                    </p>
                    <div className="flex gap-3 text-xs text-muted-foreground font-body">
                      {item.color && <span>Color: {item.color}</span>}
                      {item.size && <span>Size: {item.size}</span>}
                      <span>Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <p className="font-body text-sm font-medium">
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Address */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="font-display text-lg text-foreground mb-3 flex items-center gap-2">
                <MapPin size={18} /> Shipping Address
              </h3>
              {order.shippingAddress && (
                <div className="font-body text-sm text-muted-foreground space-y-1">
                  <p className="text-foreground font-medium">
                    {order.shippingAddress.fullName}
                  </p>
                  <p>{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && (
                    <p>{order.shippingAddress.addressLine2}</p>
                  )}
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                    {order.shippingAddress.pincode}
                  </p>
                  <p>{order.shippingAddress.phone}</p>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="font-display text-lg text-foreground mb-3">
                Payment Summary
              </h3>
              <div className="space-y-2 font-body text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{order.itemsTotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>₹{order.shippingCost?.toLocaleString()}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-sage">
                      -₹{order.discount?.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>₹{order.tax?.toLocaleString()}</span>
                </div>
                <div className="section-divider" />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>₹{order.totalAmount?.toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Payment:{" "}
                  <span className="capitalize">
                    {order.paymentInfo?.method}
                  </span>{" "}
                  —{" "}
                  <span className="capitalize">
                    {order.paymentInfo?.status}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderDetail;
