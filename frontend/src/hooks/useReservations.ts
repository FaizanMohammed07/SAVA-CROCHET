import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Reservation, ApiResponse } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export function useReservations() {
  const { isAuthenticated } = useAuth();
  return useQuery<ApiResponse<Reservation[]>>({
    queryKey: ["reservations"],
    queryFn: async () => {
      const { data } = await api.get("/reservations");
      return data;
    },
    enabled: isAuthenticated,
  });
}

export function useReservation(id: string) {
  return useQuery<ApiResponse<{ reservation: Reservation }>>({
    queryKey: ["reservation", id],
    queryFn: async () => {
      const { data } = await api.get(`/reservations/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      designRequest: string;
      colorPreference?: string;
      size?: string;
      category?: string;
      deliveryDeadline?: string;
      notes?: string;
    }) => {
      const { data } = await api.post("/reservations", body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservations"] }),
  });
}

export function useCancelReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data } = await api.post(`/reservations/${id}/cancel`, { reason });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservations"] }),
  });
}

export function useAcceptPriceEstimate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/reservations/${id}/accept-price`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservations"] }),
  });
}
