export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  specifications: Record<string, string>;
  price: number;
  compare_at_price: number | null;
  category_id: string | null;
  brand_id: string | null;
  fabric_id: string | null;
  barcode: string;
  sku: string | null;
  colors: string[];
  sizes: string[];
  stock: number;
  cost_price?: number | null;
  discount_percent?: number | null;
  size_stock?: Record<string, number> | null;
  low_stock_threshold: number;
  is_active: boolean;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_trending: boolean;
  is_best_seller: boolean;
  meta_title: string | null;
  meta_description: string | null;
  views: number;
  sales_count: number;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
  images?: ProductImage[];
  videos?: ProductVideo[];
  category?: Category;
  brand?: Brand;
  fabric?: Fabric;
  effective_price?: number;
  discount_percentage?: number;
  flash_sale?: boolean;
  reviews?: Review[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary?: boolean;
}

export interface ProductVideo {
  id: string;
  product_id: string;
  url: string;
  title: string | null;
  sort_order: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  is_active: boolean;
}

export interface Fabric {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  coupon_code: string | null;
  coupon_discount: number;
  shipping: number;
  total: number;
  payment_method: string;
  payment_status: PaymentStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export type OrderStatus = "pending" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_code?: string | null;
  product_image: string | null;
  color: string | null;
  size: string | null;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

export interface Coupon {
  id: string;
  title: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_value: number;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  product_ids: string[];
  category_ids: string[];
  customer_ids: string[];
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

export interface FlashSale {
  id: string;
  title: string;
  banner_url: string | null;
  discount_percentage: number;
  product_ids: string[];
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

export interface ProductDiscount {
  id: string;
  name: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  product_ids: string[];
  category_ids: string[];
  apply_to_new_products: boolean;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  user?: { full_name: string | null };
  product?: { name?: string; slug?: string };
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface HomepageHero {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  mobile_image_url: string | null;
  link_url: string | null;
  button_text: string;
  sort_order: number;
  is_active: boolean;
}

export type HeroSlide = HomepageHero;

export interface HomepageVideo {
  id: string;
  title: string | null;
  video_url: string;
  thumbnail_url: string | null;
  product_id?: string | null;
  product?: { id: string; name: string; slug: string } | null;
  sort_order: number;
  is_active: boolean;
}

export interface HappyCustomer {
  id: string;
  customer_name: string | null;
  image_url: string;
  caption: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

export interface User {
  id: string;
  phone: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  color?: string;
  size?: string;
  quantity: number;
  stock: number;
}

export interface InventoryLog {
  id: string;
  product_id: string;
  variant_id: string | null;
  type: "stock_in" | "stock_out" | "adjustment" | "sale" | "return";
  quantity: number;
  previous_stock: number;
  new_stock: number;
  notes: string | null;
  created_at: string;
  product?: Product;
}

export interface AdminUser {
  id: string;
  username: string;
  password_hash: string;
}

export interface SiteSettings {
  brand_name: string;
  email: string;
  phone: string;
  address: string;
  social_links: Record<string, string>;
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
}

export interface ProductFilters {
  category?: string | string[];
  brand?: string | string[];
  fabric?: string | string[];
  color?: string | string[];
  size?: string | string[];
  priceRange?: string | string[];
  availability?: string | string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: "newest" | "popular" | "price_low" | "price_high" | "discount" | "best_selling";
  search?: string;
  page?: number;
  limit?: number;
}
