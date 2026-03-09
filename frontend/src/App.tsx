import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartAnimationProvider } from "@/components/CartAnimation";
import YarnCursor from "@/components/YarnCursor";
import {
  ProtectedRoute,
  AdminRoute,
  GuestRoute,
} from "@/components/RouteGuards";
import MainLayout from "@/layouts/MainLayout";
import AdminLayout from "@/layouts/AdminLayout";
import { Loader2 } from "lucide-react";

/* ── Pages (lazy-loaded) ────────────────────────────────── */
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Auth
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const AdminLogin = lazy(() => import("./pages/auth/AdminLogin"));

// Shop
const Products = lazy(() => import("./pages/shop/Products"));
const ProductDetail = lazy(() => import("./pages/shop/ProductDetail"));

// Cart & Checkout
const Cart = lazy(() => import("./pages/cart/Cart"));
const Checkout = lazy(() => import("./pages/cart/Checkout"));

// Orders
const OrderSuccess = lazy(() => import("./pages/orders/OrderSuccess"));

// Account
const Profile = lazy(() => import("./pages/account/Profile"));
const AccountOrders = lazy(() => import("./pages/account/Orders"));
const OrderDetail = lazy(() => import("./pages/account/OrderDetail"));
const Wishlist = lazy(() => import("./pages/account/Wishlist"));
const AccountReservations = lazy(() => import("./pages/account/Reservations"));

// Reservations
const NewReservation = lazy(
  () => import("./pages/reservations/NewReservation"),
);

// Admin
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminReservations = lazy(() => import("./pages/admin/Reservations"));
const AdminCoupons = lazy(() => import("./pages/admin/Coupons"));
const AdminPayments = lazy(() => import("./pages/admin/Payments"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));

/* ── Query client ────────────────────────────────────────── */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1 },
  },
});

/* ── Loading fallback ────────────────────────────────────── */
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Loader2 className="h-8 w-8 animate-spin text-warm-brown" />
  </div>
);

/* ── App ─────────────────────────────────────────────────── */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartAnimationProvider>
            <YarnCursor />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* ── Public routes (with Navbar + Footer) ─── */}
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/shop" element={<Products />} />
                  <Route path="/shop/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />

                  {/* Guest-only auth routes */}
                  <Route element={<GuestRoute />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                      path="/forgot-password"
                      element={<ForgotPassword />}
                    />
                    <Route
                      path="/reset-password/:token"
                      element={<ResetPassword />}
                    />
                  </Route>

                  {/* Protected customer routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/checkout" element={<Checkout />} />
                    <Route
                      path="/orders/:id/success"
                      element={<OrderSuccess />}
                    />
                    <Route path="/account/profile" element={<Profile />} />
                    <Route path="/account/orders" element={<AccountOrders />} />
                    <Route
                      path="/account/orders/:id"
                      element={<OrderDetail />}
                    />
                    <Route path="/account/wishlist" element={<Wishlist />} />
                    <Route
                      path="/account/reservations"
                      element={<AccountReservations />}
                    />
                    <Route
                      path="/reservations/new"
                      element={<NewReservation />}
                    />
                  </Route>
                </Route>

                {/* ── Secret admin login portal ── */}
                <Route
                  path="/sava-admin-x7k9m2/login"
                  element={<AdminLogin />}
                />

                {/* ── Admin routes (admin layout + sidebar) ── */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route
                      path="reservations"
                      element={<AdminReservations />}
                    />
                    <Route path="coupons" element={<AdminCoupons />} />
                    <Route path="payments" element={<AdminPayments />} />
                    <Route path="analytics" element={<AdminAnalytics />} />
                  </Route>
                </Route>

                {/* ── 404 ─────────────────────────────────── */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </CartAnimationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
