import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach access token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle 401 refresh
let isRefreshing = false;
let failedQueue: {
  resolve: (v: unknown) => void;
  reject: (e: unknown) => void;
}[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip token refresh for admin auth endpoints (they use temp tokens, not JWT auth)
    // and for regular auth endpoints (login, register, 2fa) — no token to refresh yet
    const url = originalRequest?.url || "";
    const isAuthEndpoint =
      url.includes("/auth/sava-ctrl-x7k9m2/") ||
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/2fa/");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = Cookies.get("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {
            refreshToken,
          },
        );

        const newAccessToken = data.data?.accessToken || data.accessToken;
        const newRefreshToken = data.data?.refreshToken || data.refreshToken;

        Cookies.set("accessToken", newAccessToken, { expires: 0.5 });
        if (newRefreshToken) {
          Cookies.set("refreshToken", newRefreshToken, { expires: 7 });
        }

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        Cookies.remove("accessToken");
        Cookies.remove("refreshToken");

        // Let React Router guards handle redirect —
        // AdminRoute → /sava-admin-x7k9m2/login, ProtectedRoute → /login.
        // Only hard-redirect when there's no SPA guard (e.g. user is on a public page).
        const path = window.location.pathname;
        if (path.startsWith("/admin")) {
          // Admin routes: React AdminRoute guard will redirect to admin login
          window.location.href = "/sava-admin-x7k9m2/login";
        } else if (
          path.startsWith("/account") ||
          path.startsWith("/checkout") ||
          path.startsWith("/orders")
        ) {
          window.location.href = "/login";
        }
        // For all other pages (public, admin login), don't redirect — just reject
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
