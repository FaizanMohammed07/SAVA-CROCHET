// ──────────────── User & Auth ────────────────
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: "user" | "admin" | "superadmin";
  phone?: string;
  avatar?: { public_id?: string; url?: string };
  addresses: Address[];
  wishlist: string[];
  isEmailVerified: boolean;
  isBlocked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  _id: string;
  label?: "home" | "work" | "other";
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

// ──────────────── Product ────────────────
export interface ProductImage {
  url: string;
  public_id?: string;
  alt?: string;
}

export interface Product {
  _id: string;
  productName: string;
  slug: string;
  description: string;
  category: string;
  crochetType: string;
  price: number;
  discountPrice?: number;
  effectivePrice?: number;
  images: ProductImage[];
  stock: number;
  rating: { average: number; count: number };
  tags: string[];
  handmadeTime?: string;
  material: string[];
  colors: string[];
  size?: string;
  difficulty?: string;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };
  isFeatured: boolean;
  isBestSeller?: boolean;
  careInstructions?: string;
  isActive: boolean;
  sold: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  success: boolean;
  message: string;
  data: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// ──────────────── Search Suggestions ────────────────
export interface SearchSuggestionsResponse {
  success: boolean;
  message: string;
  data: {
    products: Product[];
    categories: string[];
    type: "trending" | "results";
    query?: string;
  };
}

// ──────────────── Review ────────────────
export interface Review {
  _id: string;
  user: {
    _id: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    avatar?: { url?: string };
  };
  product: string;
  rating: number;
  title?: string;
  comment: string;
  images?: ProductImage[];
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface ReviewsResponse {
  success: boolean;
  message: string;
  data: Review[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// ──────────────── Cart ────────────────
export interface CartItem {
  _id: string;
  product: Product;
  quantity: number;
  color?: string;
  size?: string;
  price: number;
  totalPrice: number;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  couponCode?: string;
  discount: number;
}

// ──────────────── Order ────────────────
export interface OrderItem {
  product: Product | string;
  productName: string;
  image: string;
  quantity: number;
  price: number;
  totalPrice: number;
  color?: string;
  size?: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: string | User;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentInfo: {
    method: "razorpay" | "cod";
    transactionId?: string;
    gatewayOrderId?: string;
    status: "pending" | "paid" | "failed" | "refunded" | "partially_refunded";
    paidAt?: string;
    refundId?: string;
    refundAmount?: number;
    refundedAt?: string;
  };
  itemsTotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  totalAmount: number;
  couponCode?: string;
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "out_for_delivery"
    | "delivered"
    | "cancelled"
    | "returned"
    | "refunded";
  statusHistory: { status: string; timestamp: string; note?: string }[];
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  notes?: string;
  isGift?: boolean;
  giftMessage?: string;
  createdAt: string;
  updatedAt: string;
}

// ──────────────── Payment ────────────────
export interface Payment {
  _id: string;
  order: string;
  user: string;
  gateway: "razorpay";
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  createdAt: string;
}

export interface RazorpayOrderResponse {
  success: boolean;
  data: {
    razorpayOrderId: string;
    amount: number;
    currency: string;
    orderId: string;
  };
}

// ──────────────── Reservation ────────────────
export interface Reservation {
  _id: string;
  user: string | User;
  reservationNumber: string;
  designRequest: string;
  referenceImages?: { public_id?: string; url?: string }[];
  colorPreference?: string;
  size: string;
  category?: string;
  deliveryDeadline: string;
  notes?: string;
  status:
    | "pending"
    | "under_review"
    | "approved"
    | "rejected"
    | "in_production"
    | "quality_check"
    | "ready"
    | "shipped"
    | "delivered"
    | "cancelled";
  adminNotes?: string;
  rejectionReason?: string;
  estimatedPrice?: number;
  finalPrice?: number;
  priceAccepted?: boolean;
  productionStartDate?: string;
  productionEndDate?: string;
  estimatedCompletionDays?: number;
  assignedTo?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  statusHistory?: { status: string; timestamp: string; note?: string }[];
  createdAt: string;
  updatedAt: string;
}

// ──────────────── Coupon ────────────────
export interface Coupon {
  _id: string;
  code: string;
  discountType: "percentage" | "flat";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

// ──────────────── Analytics ────────────────
export interface DashboardAnalytics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  recentOrders: Order[];
  revenueChart: { date: string; revenue: number }[];
  orderStatusDistribution: Record<string, number>;
}

// ──────────────── API Response wrapper ────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
