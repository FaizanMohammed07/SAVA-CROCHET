import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, CreditCard, Truck, Tag, MapPin, Plus, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart, useApplyCoupon } from "@/hooks/useCart";
import { useCreateOrder, useVerifyPayment } from "@/hooks/useOrders";
import { toast } from "sonner";
import api from "@/lib/api";
import type { Address } from "@/types";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const loadRazorpay = () =>
  new Promise<boolean>((resolve) => {
    if (document.getElementById("razorpay-script")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const Checkout = () => {
  const { user, refreshUser } = useAuth();
  const { data: cartData, isLoading: cartLoading } = useCart();
  const createOrder = useCreateOrder();
  const verifyPayment = useVerifyPayment();
  const applyCoupon = useApplyCoupon();
  const navigate = useNavigate();

  const cart = cartData?.data?.cart;
  const items = cart?.items || [];

  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">(
    "razorpay",
  );
  const [selectedAddress, setSelectedAddress] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sync selectedAddress when user data loads
  useEffect(() => {
    if (user?.addresses?.length && !selectedAddress) {
      setSelectedAddress(
        user.addresses.find((a) => a.isDefault)?._id ||
          user.addresses[0]?._id ||
          "",
      );
    }
  }, [user?.addresses, selectedAddress]);

  // Sync cart coupon state
  useEffect(() => {
    if (cart?.couponCode) {
      setAppliedCoupon(cart.couponCode);
      setCouponCode(cart.couponCode);
      setDiscount(cart.discount || 0);
    }
  }, [cart?.couponCode, cart?.discount]);

  // New address form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  const handleAddAddress = async () => {
    try {
      const { data } = await api.post("/users/addresses", newAddress);
      const result = data.data || data;
      // The backend returns { addresses: [...] }, pick the last one as newly added
      const addresses = result.addresses || [];
      const newest = addresses[addresses.length - 1];
      if (newest?._id) {
        setSelectedAddress(newest._id);
      }
      toast.success("Address added");
      setShowAddressForm(false);
      setNewAddress({
        fullName: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
      });
      // Refresh user data so addresses update without full reload
      await refreshUser();
    } catch (err: unknown) {
      const error = err as {
        response?: {
          data?: {
            message?: string;
            errors?: Array<{ field?: string; message?: string }>;
          };
        };
      };
      const errors = error?.response?.data?.errors;
      if (errors?.length) {
        const msg = errors.map((e) => e.message || e.field).join(", ");
        toast.error(`Validation: ${msg}`);
      } else {
        toast.error(error?.response?.data?.message || "Failed to add address");
      }
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    setIsApplyingCoupon(true);
    try {
      const result = await applyCoupon.mutateAsync(couponCode.trim());
      const resData = result.data || result;
      setAppliedCoupon(resData.couponCode || couponCode.trim().toUpperCase());
      setDiscount(resData.discount || 0);
      toast.success(`Coupon applied! You save ₹${resData.discount}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || "Invalid coupon code");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await api.delete("/cart/remove-coupon");
      setAppliedCoupon(null);
      setDiscount(0);
      setCouponCode("");
      toast.success("Coupon removed");
    } catch {
      toast.error("Failed to remove coupon");
    }
  };

  const handleCheckout = async () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }
    setIsProcessing(true);

    try {
      // Find the full address object to send to backend
      const addressObj = user?.addresses?.find(
        (a) => a._id === selectedAddress,
      );
      if (!addressObj) {
        toast.error("Address not found");
        return;
      }
      const shippingAddr = {
        fullName: addressObj.fullName,
        phone: addressObj.phone,
        addressLine1: addressObj.addressLine1,
        addressLine2: addressObj.addressLine2 || "",
        city: addressObj.city,
        state: addressObj.state,
        pincode: addressObj.pincode,
        country: addressObj.country || "India",
      };

      // 1. Create order
      const orderRes = await createOrder.mutateAsync({
        shippingAddress: shippingAddr as unknown as string,
        paymentMethod,
      });
      const orderData = orderRes.data || orderRes;
      const order = orderData.order || orderData;
      const orderId = order._id;

      if (paymentMethod === "cod") {
        toast.success("Order placed successfully!");
        navigate(`/orders/${orderId}/success`);
        return;
      }

      // 2. Razorpay flow
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error("Payment gateway failed to load");
        return;
      }

      // Payment data comes from createOrder response (Razorpay order created inline)
      const payment = orderData.payment;
      if (!payment?.orderId) {
        toast.error("Payment data missing from order");
        return;
      }

      const options = {
        key: payment.key || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: payment.amount,
        currency: payment.currency || "INR",
        name: "Sava Crochets",
        description: `Order #${order.orderNumber || orderId}`,
        order_id: payment.orderId,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await verifyPayment.mutateAsync({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success("Payment successful!");
            navigate(`/orders/${orderId}/success`);
          } catch {
            toast.error("Payment verification failed");
            navigate(`/account/orders`);
          }
        },
        prefill: {
          name: user?.fullName,
          email: user?.email,
          contact: user?.phone,
        },
        theme: { color: "#6B5244" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Checkout failed";
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-warm-brown" />
      </div>
    );
  }

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-display text-3xl md:text-4xl text-foreground mb-8"
        >
          Checkout
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Address */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="font-display text-xl text-foreground mb-4 flex items-center gap-2">
                <MapPin size={20} /> Delivery Address
              </h3>
              {user?.addresses && user.addresses.length > 0 ? (
                <div className="space-y-3">
                  {user.addresses.map((addr: Address) => (
                    <label
                      key={addr._id}
                      className={`block p-4 rounded-xl border cursor-pointer transition ${
                        selectedAddress === addr._id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={addr._id}
                        checked={selectedAddress === addr._id}
                        onChange={() => setSelectedAddress(addr._id)}
                        className="sr-only"
                      />
                      <p className="font-body text-sm font-medium">
                        {addr.fullName}
                      </p>
                      <p className="font-body text-sm text-muted-foreground">
                        {addr.addressLine1}, {addr.city}, {addr.state}{" "}
                        {addr.pincode}
                      </p>
                      <p className="font-body text-xs text-muted-foreground mt-1">
                        {addr.phone}
                      </p>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground font-body text-sm">
                  No saved addresses
                </p>
              )}

              <button
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="mt-3 text-sm text-primary font-body flex items-center gap-1 hover:underline"
              >
                <Plus size={14} /> Add New Address
              </button>

              {showAddressForm && (
                <div className="mt-4 space-y-3 p-4 rounded-xl border border-border bg-muted/30">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      placeholder="Full Name"
                      value={newAddress.fullName}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          fullName: e.target.value,
                        })
                      }
                      className="px-3 py-2 rounded-lg border border-border bg-background font-body text-sm"
                    />
                    <input
                      placeholder="Phone"
                      value={newAddress.phone}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, phone: e.target.value })
                      }
                      className="px-3 py-2 rounded-lg border border-border bg-background font-body text-sm"
                    />
                  </div>
                  <input
                    placeholder="Address Line 1"
                    value={newAddress.addressLine1}
                    onChange={(e) =>
                      setNewAddress({
                        ...newAddress,
                        addressLine1: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background font-body text-sm"
                  />
                  <input
                    placeholder="Address Line 2 (optional)"
                    value={newAddress.addressLine2}
                    onChange={(e) =>
                      setNewAddress({
                        ...newAddress,
                        addressLine2: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background font-body text-sm"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      placeholder="City"
                      value={newAddress.city}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, city: e.target.value })
                      }
                      className="px-3 py-2 rounded-lg border border-border bg-background font-body text-sm"
                    />
                    <input
                      placeholder="State"
                      value={newAddress.state}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, state: e.target.value })
                      }
                      className="px-3 py-2 rounded-lg border border-border bg-background font-body text-sm"
                    />
                    <input
                      placeholder="Pincode"
                      value={newAddress.pincode}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          pincode: e.target.value,
                        })
                      }
                      className="px-3 py-2 rounded-lg border border-border bg-background font-body text-sm"
                    />
                  </div>
                  <button
                    onClick={handleAddAddress}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-body text-sm hover:opacity-90 transition"
                  >
                    Save Address
                  </button>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="font-display text-xl text-foreground mb-4 flex items-center gap-2">
                <CreditCard size={20} /> Payment Method
              </h3>
              <div className="space-y-3">
                <label
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${
                    paymentMethod === "razorpay"
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="razorpay"
                    checked={paymentMethod === "razorpay"}
                    onChange={() => setPaymentMethod("razorpay")}
                    className="accent-primary"
                  />
                  <div>
                    <p className="font-body text-sm font-medium">
                      Pay Online (Razorpay)
                    </p>
                    <p className="font-body text-xs text-muted-foreground">
                      UPI, Cards, Net Banking, Wallets
                    </p>
                  </div>
                </label>
                <label
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${
                    paymentMethod === "cod"
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="accent-primary"
                  />
                  <div>
                    <p className="font-body text-sm font-medium">
                      Cash on Delivery
                    </p>
                    <p className="font-body text-xs text-muted-foreground">
                      Pay when you receive your order
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Coupon */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="font-display text-xl text-foreground mb-4 flex items-center gap-2">
                <Tag size={20} /> Coupon Code
              </h3>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-200">
                  <div>
                    <p className="font-body text-sm font-medium text-green-800">
                      Coupon <span className="font-bold">{appliedCoupon}</span>{" "}
                      applied
                    </p>
                    <p className="font-body text-xs text-green-600">
                      You save ₹{discount.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="p-1.5 rounded-lg hover:bg-green-100 transition text-green-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <input
                    value={couponCode}
                    onChange={(e) =>
                      setCouponCode(e.target.value.toUpperCase())
                    }
                    placeholder="Enter coupon code"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon || !couponCode.trim()}
                    className="px-5 py-2.5 rounded-xl border border-border font-body text-sm hover:bg-muted transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {isApplyingCoupon ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-card rounded-2xl p-6 border border-border sticky top-24">
              <h3 className="font-display text-xl text-foreground mb-4 flex items-center gap-2">
                <Truck size={20} /> Order Summary
              </h3>

              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item._id} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                      <img
                        src={
                          item.product?.images?.[0]?.url || "/placeholder.svg"
                        }
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-foreground truncate">
                        {item.product?.productName}
                      </p>
                      <p className="font-body text-xs text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-body text-sm font-medium">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="section-divider mb-4" />

              <div className="space-y-2 mb-6">
                <div className="flex justify-between font-body text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{cart?.totalAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-body text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-sage">
                    {(cart?.totalAmount || 0) >= 999 ? "Free" : "₹79"}
                  </span>
                </div>
                <div className="flex justify-between font-body text-sm">
                  <span className="text-muted-foreground">Tax (18% GST)</span>
                  <span>
                    ₹
                    {Math.round(
                      (cart?.totalAmount || 0) * 0.18,
                    ).toLocaleString()}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between font-body text-sm text-green-600">
                    <span>Coupon Discount</span>
                    <span>-₹{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="section-divider" />
                <div className="flex justify-between font-body font-semibold text-lg">
                  <span>Total</span>
                  <span>
                    ₹
                    {(
                      (cart?.totalAmount || 0) +
                      ((cart?.totalAmount || 0) >= 999 ? 0 : 79) +
                      Math.round((cart?.totalAmount || 0) * 0.18) -
                      discount
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isProcessing || !selectedAddress}
                className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-body text-sm font-medium hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                  </>
                ) : paymentMethod === "razorpay" ? (
                  "Pay Now"
                ) : (
                  "Place Order"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
