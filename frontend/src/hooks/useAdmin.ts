import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  Order,
  Reservation,
  Coupon,
  User,
  DashboardAnalytics,
  ApiResponse,
} from "@/types";

// ── Dashboard ──
export function useAdminDashboard() {
  return useQuery<ApiResponse<DashboardAnalytics>>({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/admin/analytics/dashboard");
      return data;
    },
    refetchInterval: 30_000, // refresh every 30 seconds
    refetchOnWindowFocus: true, // refresh when tab gains focus
    staleTime: 15_000, // data considered fresh for 15 seconds
  });
}

export function useAdminRevenue(params?: {
  startDate?: string;
  endDate?: string;
  period?: string;
}) {
  return useQuery({
    queryKey: ["admin", "revenue", params],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (params?.startDate) p.append("startDate", params.startDate);
      if (params?.endDate) p.append("endDate", params.endDate);
      if (params?.period) p.append("period", params.period);
      const { data } = await api.get(
        `/admin/analytics/revenue?${p.toString()}`,
      );
      return data;
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}

// ── Users ──
export function useAdminUsers(params?: { page?: number; role?: string }) {
  return useQuery<ApiResponse<User[]>>({
    queryKey: ["admin", "users", params],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (params?.page) p.append("page", String(params.page));
      if (params?.role) p.append("role", params.role);
      const { data } = await api.get(`/admin/users?${p.toString()}`);
      return data;
    },
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}

export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.patch(`/admin/users/${userId}/block`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

// ── Orders ──
export function useAdminOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  return useQuery<ApiResponse<Order[]>>({
    queryKey: ["admin", "orders", params],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (params?.page) p.append("page", String(params.page));
      if (params?.limit) p.append("limit", String(params.limit));
      if (params?.status) p.append("status", params.status);
      if (params?.search) p.append("search", params.search);
      const { data } = await api.get(`/admin/orders?${p.toString()}`);
      return data;
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      status,
      trackingNumber,
      trackingUrl,
      note,
    }: {
      orderId: string;
      status: string;
      trackingNumber?: string;
      trackingUrl?: string;
      note?: string;
    }) => {
      const { data } = await api.patch(`/admin/orders/${orderId}/status`, {
        status,
        trackingNumber,
        trackingUrl,
        note,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

// ── Inventory ──
export function useUpdateInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId,
      stock,
    }: {
      productId: string;
      stock: number;
    }) => {
      const { data } = await api.patch(`/admin/inventory/${productId}`, {
        stock,
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

// ── Reservations ──
export function useAdminReservations(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return useQuery<ApiResponse<Reservation[]>>({
    queryKey: ["admin", "reservations", params],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (params?.page) p.append("page", String(params.page));
      if (params?.limit) p.append("limit", String(params.limit));
      if (params?.status) p.append("status", params.status);
      const { data } = await api.get(`/admin/reservations?${p.toString()}`);
      return data;
    },
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}

export function useUpdateReservationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      status: string;
      adminNotes?: string;
      estimatedPrice?: number;
      rejectionReason?: string;
      estimatedCompletionDays?: number;
      priority?: string;
    }) => {
      const { data } = await api.patch(
        `/admin/reservations/${id}/status`,
        body,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reservations"] });
      qc.invalidateQueries({ queryKey: ["reservations"] });
    },
  });
}

// ── Coupons ──
export function useAdminCoupons() {
  return useQuery<ApiResponse<Coupon[]>>({
    queryKey: ["admin", "coupons"],
    queryFn: async () => {
      const { data } = await api.get("/admin/coupons");
      return data;
    },
  });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<Coupon>) => {
      const { data } = await api.post("/admin/coupons", body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "coupons"] }),
  });
}

export function useUpdateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string } & Partial<Coupon>) => {
      const { data } = await api.put(`/admin/coupons/${id}`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "coupons"] }),
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/admin/coupons/${id}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "coupons"] }),
  });
}

// ── Payments ──
export function useAdminPayments(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return useQuery({
    queryKey: ["admin", "payments", params],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (params?.page) p.append("page", String(params.page));
      if (params?.limit) p.append("limit", String(params.limit));
      if (params?.status) p.append("status", params.status);
      const { data } = await api.get(`/admin/payments?${p.toString()}`);
      return data;
    },
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}

export function useRefundPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      paymentId,
      amount,
      reason,
    }: {
      paymentId: string;
      amount?: number;
      reason?: string;
    }) => {
      const { data } = await api.post(`/admin/payments/${paymentId}/refund`, {
        amount,
        reason,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "payments"] });
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
  });
}

// ── Analytics ──
export function useAnalytics(type: string, params?: { period?: string }) {
  return useQuery({
    queryKey: ["admin", "analytics", type, params],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (params?.period) p.append("period", params.period);
      const { data } = await api.get(
        `/admin/analytics/${type}?${p.toString()}`,
      );
      return data;
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}
