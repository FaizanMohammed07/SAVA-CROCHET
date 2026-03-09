import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  Product,
  ProductsResponse,
  Review,
  ReviewsResponse,
  ApiResponse,
  SearchSuggestionsResponse,
} from "@/types";

interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string;
  crochetType?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  search?: string;
  tags?: string;
  featured?: string;
  inStock?: string;
  color?: string;
  material?: string;
  difficulty?: string;
  minRating?: number;
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery<ProductsResponse>({
    queryKey: ["products", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== "" && val !== null)
          params.append(key, String(val));
      });
      const { data } = await api.get(`/products?${params.toString()}`);
      return data;
    },
  });
}

export function useProduct(id: string) {
  return useQuery<ApiResponse<{ product: Product; reviews: Review[] }>>({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data } = await api.get(`/products/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useProductReviews(productId: string) {
  return useQuery<ReviewsResponse>({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data } = await api.get(`/products/${productId}/reviews`);
      return data;
    },
    enabled: !!productId,
  });
}

export function useCreateReview(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      rating: number;
      title?: string;
      comment: string;
    }) => {
      const { data } = await api.post(`/products/${productId}/reviews`, body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
      qc.invalidateQueries({ queryKey: ["product", productId] });
    },
  });
}

// Admin
export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      formData,
    }: {
      id: string;
      formData: FormData;
    }) => {
      const { data } = await api.put(`/products/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/products/${id}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

// ─── Search Suggestions (Zepto-style instant search) ───────
export function useSearchSuggestions(query: string) {
  return useQuery<SearchSuggestionsResponse>({
    queryKey: ["search-suggestions", query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query) params.append("q", query);
      params.append("limit", "8");
      const { data } = await api.get(
        `/products/suggestions?${params.toString()}`,
      );
      return data;
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    // Always enabled — empty query returns trending products
    enabled: true,
  });
}

// ─── Smart Product Recommendations ─────────────────────────
export function useRecommendations(productId: string, limit = 8) {
  return useQuery<ApiResponse<{ recommendations: Product[] }>>({
    queryKey: ["recommendations", productId, limit],
    queryFn: async () => {
      const { data } = await api.get(
        `/products/${productId}/recommendations?limit=${limit}`,
      );
      return data;
    },
    enabled: !!productId,
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
  });
}
