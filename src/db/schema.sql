-- Schema SQL for Supabase Product Catalog (كتالوج المنتجات)
-- Created: 2026-07-09

-- Enable UUID extension in Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Categories Table (جدول الأقسام الرئيسية)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    slug VARCHAR(255) NOT NULL UNIQUE,
    image_url TEXT NOT NULL,
    description TEXT,
    description_en TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for category slugs (SEO routing)
CREATE INDEX idx_categories_slug ON categories(slug);

-- 2. Products Table (جدول المنتجات)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    short_description TEXT NOT NULL,
    full_description TEXT NOT NULL,
    specs JSONB NOT NULL DEFAULT '{}'::jsonb, -- Store dynamic key-value specifications
    price DECIMAL(10, 2) DEFAULT NULL, -- Nullable as requested, some items may not show price
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    features JSONB DEFAULT '[]'::jsonb, -- Store custom product features/badges
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for products querying
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_is_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- 3. Product Images Table (جدول صور المنتجات المتعددة)
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for images sort order
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_sort ON product_images(product_id, sort_order ASC);

-- 4. Contact Requests Table (جدول طلبات التواصل والطلب)
CREATE TABLE contact_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'جديد',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for admin retrieval order
CREATE INDEX idx_contact_requests_created_at ON contact_requests(created_at DESC);

-- Helpful comments for Supabase dashboard
COMMENT ON TABLE categories IS 'الأقسام الرئيسية لمنتجات الكتالوج';
COMMENT ON TABLE products IS 'تفاصيل المنتجات ومواصفاتها وأسعارها';
COMMENT ON TABLE product_images IS 'معرض الصور الإضافية لكل منتج';
COMMENT ON TABLE contact_requests IS 'طلبات التواصل الواردة من العملاء عبر فورم الموقع';

-- 5. Maintenance Requests Table (جدول طلبات الصيانة والضمان المعتمد)
CREATE TABLE maintenance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    issue_description TEXT NOT NULL,
    purchase_date DATE DEFAULT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'جديد',
    image_urls JSONB DEFAULT '[]'::jsonb,
    is_seen BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for admin retrieval order
CREATE INDEX idx_maintenance_requests_created_at ON maintenance_requests(created_at DESC);

-- ==========================================
-- 9. Site Content CMS Table (جدول إدارة محتوى نصوص الصفحات الثابتة)
-- ==========================================
CREATE TABLE IF NOT EXISTS site_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    content_type TEXT DEFAULT 'text',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security for site_content
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Policies for site_content
CREATE POLICY "Public can read site content"
ON site_content FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated can update site content"
ON site_content FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated can insert site content"
ON site_content FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can delete site content"
ON site_content FOR DELETE
TO authenticated
USING (true);

COMMENT ON TABLE site_content IS 'جدول تخزين النصوص الثابتة والقابلة للتعديل من لوحة التحكم';


-- Enable Row Level Security for all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

-- A. Categories Policies
CREATE POLICY "Allow public read-only access to categories" 
ON categories FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated admin full access to categories" 
ON categories FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- B. Products Policies
CREATE POLICY "Allow public read-only access to products" 
ON products FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated admin full access to products" 
ON products FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- C. Product Images Policies
CREATE POLICY "Allow public read-only access to product images" 
ON product_images FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated admin full access to product images" 
ON product_images FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- D. Contact Requests Policies
CREATE POLICY "Allow anyone to insert contact requests" 
ON contact_requests FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow authenticated admin full access to contact requests" 
ON contact_requests FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- E. Maintenance Requests Policies
CREATE POLICY "Allow anyone to insert maintenance requests" 
ON maintenance_requests FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow authenticated admin full access to maintenance requests" 
ON maintenance_requests FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);


-- ==========================================
-- 7. Storage Bucket configuration & Policies for "products", "images" & "product-images"
-- ==========================================
-- Run this block to create the storage buckets and their policies
-- (Alternatively, you can create these buckets via the Supabase Dashboard as Public)

-- Insert buckets if they do not exist
INSERT INTO storage.buckets (id, name, public) 
VALUES 
('products', 'products', true),
('images', 'images', true),
('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for Public read access to bucket files
CREATE POLICY "Allow public access to products"
ON storage.objects FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "Allow public access to images"
ON storage.objects FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Allow public access to product-images"
ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

-- Policy for Authenticated users to upload files
CREATE POLICY "Allow authenticated admin to upload files to products"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'products');

CREATE POLICY "Allow authenticated admin to upload files to images"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'images');

CREATE POLICY "Allow authenticated admin to upload files to product-images"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');

-- Policy for Authenticated users to update/delete files
CREATE POLICY "Allow authenticated admin to edit/delete files in products"
ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'products') WITH CHECK (bucket_id = 'products');

CREATE POLICY "Allow authenticated admin to edit/delete files in images"
ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'images') WITH CHECK (bucket_id = 'images');

CREATE POLICY "Allow authenticated admin to edit/delete files in product-images"
ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow authenticated admin to delete files from products"
ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'products');

CREATE POLICY "Allow authenticated admin to delete files from images"
ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'images');

CREATE POLICY "Allow authenticated admin to delete files from product-images"
ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images');


-- ==========================================
-- 8. Storage Bucket configuration & Policies for "maintenance-images"
-- ==========================================
-- Create the public bucket for maintenance requests images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('maintenance-images', 'maintenance-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for Public read access to maintenance-images files
CREATE POLICY "Allow public access to maintenance-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'maintenance-images');

-- Policy for Public/Anonymous users to upload files to maintenance-images
CREATE POLICY "Allow anonymous/public users to upload files to maintenance-images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'maintenance-images');

-- Policy for Authenticated users to update/delete files in maintenance-images
CREATE POLICY "Allow authenticated admin to edit/delete files in maintenance-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'maintenance-images')
WITH CHECK (bucket_id = 'maintenance-images');

CREATE POLICY "Allow authenticated admin to delete files from maintenance-images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'maintenance-images');


