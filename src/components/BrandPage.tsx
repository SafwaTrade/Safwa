import React, { useMemo, useState } from "react";
import { Category, Product, Brand } from "../types";
import ProductCard from "./ProductCard";
import { useTranslation } from "react-i18next";
import { getCategoryName, getBrandName } from "../utils/localize";
import { 
  ChevronRight, 
  ChevronLeft,
  Layers, 
  PackageX,
  Sparkles,
  ArrowRight
} from "lucide-react";

interface BrandPageProps {
  brand: Brand;
  categories: Category[];
  products: Product[];
  onNavigateToHome: () => void;
  onSelectProduct: (slug: string) => void;
}

export default function BrandPage({ 
  brand, 
  categories, 
  products, 
  onNavigateToHome, 
  onSelectProduct 
}: BrandPageProps) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || "ar";

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Get all products belonging to this brand
  const brandProducts = useMemo(() => {
    return products.filter(p => p.brand_id === brand.id);
  }, [brand.id, products]);

  // Group products by category
  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    brandProducts.forEach(product => {
      if (!groups[product.category_id]) {
        groups[product.category_id] = [];
      }
      groups[product.category_id].push(product);
    });
    return groups;
  }, [brandProducts]);

  // Get categories that have products from this brand
  const brandCategories = useMemo(() => {
    const categoryMap: Record<string, { category: Category; count: number }> = {};
    brandProducts.forEach(product => {
      const catId = product.category_id;
      if (!categoryMap[catId]) {
        const category = categories.find(c => c.id === catId) || {
          id: catId,
          name: "أخرى",
          slug: "other",
          image_url: ""
        };
        categoryMap[catId] = { category, count: 0 };
      }
      categoryMap[catId].count++;
    });
    return Object.values(categoryMap);
  }, [brandProducts, categories]);

  return (
    <div className="bg-zinc-50 min-h-screen py-8" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs Navigation */}
        <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-6 font-medium">
          <button 
            onClick={onNavigateToHome}
            className="hover:text-[#3e499e] transition-colors cursor-pointer"
          >
            {currentLang === "en" ? "Home" : "الرئيسية"}
          </button>
          <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          <span className="text-zinc-400">{currentLang === "en" ? "Brands" : "العلامات التجارية"}</span>
          <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          {selectedCategoryId ? (
            <>
              <button
                onClick={() => setSelectedCategoryId(null)}
                className="hover:text-[#3e499e] transition-colors cursor-pointer text-zinc-500"
              >
                {getBrandName(brand, currentLang)}
              </button>
              <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
              <span className="text-zinc-900 font-bold">
                {(() => {
                  const cat = categories.find(c => c.id === selectedCategoryId);
                  return cat ? getCategoryName(cat, currentLang) : (currentLang === "en" ? "Other" : "أخرى");
                })()}
              </span>
            </>
          ) : (
            <span className="text-zinc-900 font-bold">{getBrandName(brand, currentLang)}</span>
          )}
        </nav>

        {/* Brand Hero Block */}
        <div className="relative bg-zinc-950 text-white rounded-3xl overflow-hidden mb-10 shadow-lg border border-zinc-900/80 p-8 sm:p-12">
          <div className="absolute inset-0 bg-gradient-to-l from-zinc-950 via-zinc-950/80 to-zinc-900/40 z-10"></div>
          
          <div className="relative z-20 flex flex-col md:flex-row items-center justify-between gap-8 w-full">
            <div className="space-y-4 max-w-2xl text-right md:order-1">
              <span className="inline-flex items-center gap-1.5 bg-[#3e499e]/20 text-blue-200 text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-[#3e499e]/40 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 fill-blue-300 text-blue-300" />
                <span>{currentLang === "en" ? "Original Products & Authorized Dealer" : "المنتجات الأصلية والوكيل الحصري"}</span>
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                {currentLang === "en" ? `${getBrandName(brand, currentLang)} Products` : `منتجات علامة ${getBrandName(brand, currentLang)}`}
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                {currentLang === "en" 
                  ? `Browse certified high-performance products from ${getBrandName(brand, currentLang)}.`
                  : `تصفح أفضل المنتجات المصنعة بجودة عالمية فائقة من شركة ${getBrandName(brand, currentLang)} المعتمدة.`}
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-md border border-zinc-800/20 p-5 rounded-2xl w-44 h-24 flex items-center justify-center shadow-lg md:order-2 shrink-0">
              {brand.logo_url ? (
                <img 
                  src={brand.logo_url} 
                  alt={getBrandName(brand, currentLang)}
                  className="max-w-full max-h-full object-contain filter contrast-125"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-zinc-950 font-black text-2xl uppercase tracking-widest">{getBrandName(brand, currentLang)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Brand Products Section */}
        {brandProducts.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-sm space-y-4">
            <div className="bg-[#3e499e]/10 text-[#3e499e] p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto border border-[#3e499e]/20">
              <PackageX className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-black text-zinc-900">{currentLang === "en" ? "No Products Available" : "لا توجد منتجات حالياً"}</h2>
            <p className="text-zinc-500 text-xs leading-relaxed">
              {currentLang === "en"
                ? `No products currently linked to ${getBrandName(brand, currentLang)} in the database.`
                : `لم نقم بربط أي منتجات ببراند ${getBrandName(brand, currentLang)} في قاعدة البيانات بعد. ترقب إضافة أحدث الموديلات قريباً!`}
            </p>
            <button 
              onClick={onNavigateToHome}
              className="mt-2 bg-zinc-900 hover:bg-zinc-850 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-colors"
            >
              {currentLang === "en" ? "Back to Home" : "العودة للرئيسية"}
            </button>
          </div>
        ) : (
          <div>
            {!selectedCategoryId ? (
              <div className="space-y-8">
                <div className="border-b border-zinc-200 pb-4">
                  <h2 className="text-xl font-black text-zinc-950">
                    {currentLang === "en" ? `Available Categories for ${getBrandName(brand, currentLang)}` : `الأقسام المتاحة لـ ${getBrandName(brand, currentLang)}`}
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    {currentLang === "en" ? "Select a category to view products under this brand:" : "اختر قسماً لتصفح المنتجات المتوفرة تحت هذه العلامة التجارية:"}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {brandCategories.map(({ category, count }) => (
                    <div 
                      key={category.id}
                      id={`brand-category-card-${category.id}`}
                      onClick={() => setSelectedCategoryId(category.id)}
                      className="bg-white border border-zinc-200 hover:border-[#3e499e] hover:shadow-md transition-all duration-300 rounded-2xl p-5 cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200/50 flex items-center justify-center">
                          {category.image_url ? (
                            <img 
                              src={category.image_url} 
                              alt={getCategoryName(category, currentLang)}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Layers className="w-6 h-6 text-zinc-400" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-bold text-zinc-900 group-hover:text-[#3e499e] transition-colors text-sm sm:text-base">
                            {getCategoryName(category, currentLang)}
                          </h3>
                          <p className="text-xs text-zinc-500 font-semibold">
                            {count} {currentLang === "en" ? (count === 1 ? "product" : "products") : (count === 1 ? "منتج" : count > 2 && count < 11 ? "منتجات" : "منتج")}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-black text-[#3e499e]">
                        <span>{currentLang === "en" ? "View Products" : "عرض المنتجات"}</span>
                        <ChevronLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform rtl:rotate-0 ltr:rotate-180" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <button
                  id="brand-back-to-categories-btn"
                  onClick={() => setSelectedCategoryId(null)}
                  className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-850 text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer border border-zinc-800"
                >
                  <ArrowRight className="w-4 h-4 shrink-0 rtl:rotate-0 ltr:rotate-180" />
                  <span>{currentLang === "en" ? `Back to all ${getBrandName(brand, currentLang)} categories` : `الرجوع لجميع أقسام ${getBrandName(brand, currentLang)}`}</span>
                </button>

                {(() => {
                  const category = categories.find(c => c.id === selectedCategoryId);
                  const catProducts = groupedProducts[selectedCategoryId] || [];
                  return (
                    <section className="space-y-6">
                      {/* Category Header */}
                      <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="bg-[#3e499e] text-white p-2 rounded-xl">
                            <Layers className="w-4 h-4" />
                          </div>
                          <h2 className="text-lg sm:text-xl font-black text-zinc-900">
                            {currentLang === "en" 
                              ? `${category ? getCategoryName(category, currentLang) : "Other"} products from ${getBrandName(brand, currentLang)}`
                              : `منتجات ${category ? getCategoryName(category, currentLang) : "أخرى"} من ${getBrandName(brand, currentLang)}`
                            }
                          </h2>
                        </div>
                        <span className="text-xs bg-zinc-200/65 text-zinc-600 font-extrabold px-3 py-1.5 rounded-full">
                          {catProducts.length} {currentLang === "en" ? (catProducts.length === 1 ? "1 product" : "products") : (catProducts.length === 1 ? "منتج واحد" : "منتجات")}
                        </span>
                      </div>

                      {/* Products Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {catProducts.map(product => (
                          <ProductCard 
                            key={product.id}
                            product={product}
                            onSelect={onSelectProduct}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })()}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
