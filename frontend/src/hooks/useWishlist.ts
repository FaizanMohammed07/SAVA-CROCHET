import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Product, ApiResponse } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export function useWishlist() {
  const { isAuthenticated } = useAuth();
  return useQuery<ApiResponse<{ wishlist: Product[] }>>({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const { data } = await api.get("/users/wishlist");
      return data;
    },
    enabled: isAuthenticated,
  });
}

export function useToggleWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await api.post(`/users/wishlist/${productId}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlist"] }),
  });
}

export function useRemoveFromWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await api.delete(`/users/wishlist/${productId}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlist"] }),
  });
}
