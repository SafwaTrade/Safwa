/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Category {
  id: string;
  name: string;
  name_en?: string;
  slug: string;
  image_url: string;
  description?: string;
  description_en?: string;
  productCount?: number; // Optional helper for count of products
}

export interface Product {
  id: string;
  category_id: string;
  brand_id?: string | null;
  name: string;
  name_en?: string;
  slug: string;
  short_description: string;
  short_description_en?: string;
  full_description: string;
  full_description_en?: string;
  specs: Record<string, string>; // JSONB representation
  specs_en?: Record<string, string>;
  price?: number | null;
  images: string[]; // Aggregated product images
  is_featured: boolean;
  is_available?: boolean;
  features?: string[]; // Store custom product features/badges (array of strings)
  features_en?: string[];
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
}

export interface ContactRequest {
  id: string;
  name: string;
  phone: string;
  message: string;
  created_at: string;
  status?: string;
}

export interface MaintenanceRequest {
  id: string;
  name: string;
  phone: string;
  product_name: string;
  issue_description: string;
  purchase_date?: string | null;
  created_at: string;
  status?: string;
  image_urls?: string[] | null;
  is_seen?: boolean;
}

export interface Brand {
  id: string;
  name: string;
  name_en?: string;
  slug: string;
  logo_url?: string;
  sort_order: number;
  created_at?: string;
}

