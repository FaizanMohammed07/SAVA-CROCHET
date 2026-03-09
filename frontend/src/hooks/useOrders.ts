import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Order, ShippingAddress, ApiResponse } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export function useOrders() {
  const { isAuthenticated } = useAuth();
  return useQuery<ApiResponse<Order[]>>({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data } = await api.get("/orders");
      return data;
    },
    enabled: isAuthenticated,
  });
}

export function useOrder(id: string) {
  return useQuery<ApiResponse<{ order: Order }>>({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data } = await api.get(`/orders/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      shippingAddress: ShippingAddress | string;
      paymentMethod: "razorpay" | "cod";
      couponCode?: string;
    }) => {
      const { data } = await api.post("/orders", body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      reason,
    }: {
      orderId: string;
      reason?: string;
    }) => {
      const { data } = await api.post(`/orders/${orderId}/cancel`, { reason });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

// Payments
export function useVerifyPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => {
      const { data } = await api.post("/payments/razorpay/verify", body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
