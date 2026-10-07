import React, { useState, useMemo } from "react";
import { Category, Product } from "../types";
import { placeholderProducts } from "../data/placeholder";
import ProductCard from "./ProductCard";
import { useTranslation } from "react-i18next";
import { getCategoryName, getCategoryDescription } from "../utils/localize";
import { 
  SlidersHorizontal, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft,
  Search, 
  Tag, 
  Layers, 
  X,
  PackageX
} from "lucide-react";

interface CategoryPageProps {
  category: Category;
  onNavigateToHome: () => void;
  onSelectProduct: (slug: string) => void;
  products?: Product[];
}

export default function CategoryPage({ category, onNavigateToHome, onSelectProduct, products = placeholderProducts }: CategoryPageProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "ar";

  const categoryName = getCategoryName(category, currentLang);
  const categoryDesc = getCategoryDescription(category, currentLang) || 
    (currentLang === "en" ? "Browse our premium selection of certified appliances." : "تصفح مجموعتنا المميزة من المنتجات والأجهزة المعروضة.");

  const [searchQuery, setSearchQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState<number>(20000);
  const [selectedSpecVal, setSelectedSpecVal] = useState<string>("");

  // Get all products belonging to this category
  const categoryProducts = useMemo(() => {
    return products.filter(p => p.category_id === category.id);
  }, [category.id, products]);

  // Find unique specifications values for simple filtering demo
  const specFilterOptions = useMemo(() => {
    const vals = new Set<string>();
    categoryProducts.forEach(p => {
      // Find voltage, motor type, or power options from keys to filter dynamically
      Object.entries(p.specs).forEach(([key, value]) => {
        if (key.includes("جهد") || key.includes("محرك") || key.includes("قدرة") || key.includes("خامة") || key.includes("نوع")) {
          vals.add(`${key}: ${value}`);
        }
      });
    });
    return Array.from(vals);
  }, [categoryProducts]);

  // Find max price in this category to set slider dynamically
  const maxCategoryPrice = useMemo(() => {
    const prices = categoryProducts.map(p => p.price).filter((p): p is number => typeof p === "number");
    return prices.length > 0 ? Math.max(...prices) : 20000;
  }, [categoryProducts]);

  // Handle resetting filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setMaxPrice(maxCategoryPrice);
    setSelectedSpecVal("");
  };

  // Filtered list
  const filteredProducts = useMemo(() => {
    return categoryProducts.filter(product => {
      // Search term match (searches both Arabic and English names/descriptions)
      const nameToSearch = `${product.name} ${product.name_en || ""}`.toLowerCase();
      const descToSearch = `${product.short_description || ""} ${product.short_description_en || ""}`.toLowerCase();
      const query = searchQuery.toLowerCase().trim();
      
      const matchesSearch = !query || nameToSearch.includes(query) || descToSearch.includes(query);
      
      // Price limit match
      const matchesPrice = product.price ? product.price <= maxPrice : true;

      // Specification match (if selected)
      let matchesSpec = true;
      if (selectedSpecVal) {
        const [specKey, specVal] = selectedSpecVal.split(": ");
        matchesSpec = product.specs[specKey] === specVal || (product.specs_en && product.specs_en[specKey] === specVal);
      }

      return matchesSearch && matchesPrice && matchesSpec;
    });
  }, [categoryProducts, searchQuery, maxPrice, selectedSpecVal]);

  return (
    <div className="bg-zinc-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs Navigation */}
        <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-6 font-medium">
          <button 
            onClick={onNavigateToHome}
            className="hover:text-[#3e499e] transition-colors cursor-pointer"
          >
            {t("nav.home")}
          </button>
          <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          <span className="text-zinc-400">{t("nav.categories")}</span>
          <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          <span className="text-zinc-900 font-bold">{categoryName}</span>
        </nav>

        {/* Category Hero Block */}
        <div className="relative bg-zinc-950 text-white rounded-3xl overflow-hidden mb-10 shadow-lg border border-zinc-900">
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/30 z-10"></div>
          <img 
            src={category.image_url} 
            alt={categoryName}
            className="absolute inset-0 w-full h-full object-cover opacity-35"
            referrerPolicy="no-referrer"
          />
          <div className="relative z-20 p-8 sm:p-12 max-w-3xl text-start space-y-4">
            <span className="inline-block bg-[#3e499e] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow">
              {currentLang === "en" ? `Certified ${categoryName} Catalog` : `كتالوج ${categoryName} المعتمد`}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {categoryName}
            </h1>
            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
              {categoryDesc}
            </p>
          </div>
        </div>

        {/* Main Section: Filters + Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Filters Sidebar (1 Column) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-sm text-start space-y-6 sticky top-28">
              
              {/* Filter Header */}
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#3e499e]" />
                  <h3 className="font-extrabold text-zinc-950 text-sm">
                    {currentLang === "en" ? "Search & Filters" : "أدوات التصفية والبحث"}
                  </h3>
                </div>
                {(searchQuery || selectedSpecVal || maxPrice < maxCategoryPrice) && (
                  <button 
                    onClick={handleResetFilters}
                    className="text-xs text-[#3e499e] hover:text-[#323a7e] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{currentLang === "en" ? "Reset" : "إعادة ضبط"}</span>
                  </button>
                )}
              </div>

              {/* Search Within Category */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-700">
                  {currentLang === "en" ? "Search in this category" : "ابحث في هذا القسم"}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={currentLang === "en" ? "e.g. Drill, 20V..." : "مثال: شنيور، ٢٠ فولت..."}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#3e499e] text-start"
                  />
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Price Filter Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-zinc-700">
                    {currentLang === "en" ? "Max Price" : "الحد الأقصى للسعر"}
                  </label>
                  <span className="font-mono text-[#3e499e] font-bold">
                    {currentLang === "en" ? `${maxPrice.toLocaleString("en-US")} EGP` : `${maxPrice.toLocaleString("ar-EG")} ج.م`}
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max={maxCategoryPrice || 20000}
                  step="100"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-150 rounded-lg appearance-none cursor-pointer accent-[#3e499e]"
                />
                <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                  <span>{currentLang === "en" ? "500 EGP" : "500 ج.م"}</span>
                  <span>{currentLang === "en" ? `${maxCategoryPrice.toLocaleString("en-US")} EGP` : `${maxCategoryPrice.toLocaleString("ar-EG")} ج.م`}</span>
                </div>
              </div>

              {/* Dynamic Specifications filter based on products */}
              {specFilterOptions.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-zinc-700">
                    {currentLang === "en" ? "Specifications & Tech" : "المواصفات والتقنيات"}
                  </label>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => setSelectedSpecVal("")}
                      className={`text-start text-xs px-3 py-2 rounded-xl transition-all border ${
                        !selectedSpecVal 
                          ? "bg-[#3e499e]/10 border-[#3e499e]/20 text-[#3e499e] font-bold" 
                          : "bg-zinc-50 border-zinc-100 hover:bg-zinc-100/50 text-zinc-600"
                      }`}
                    >
                      {currentLang === "en" ? "All" : "الكل"}
                    </button>
                    {specFilterOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setSelectedSpecVal(opt)}
                        className={`text-start text-xs px-3 py-2 rounded-xl transition-all border break-all line-clamp-1 ${
                          selectedSpecVal === opt 
                            ? "bg-[#3e499e]/10 border-[#3e499e]/20 text-[#3e499e] font-bold" 
                            : "bg-zinc-50 border-zinc-100 hover:bg-zinc-100/50 text-zinc-600"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Active filters summary */}
              {(searchQuery || selectedSpecVal || maxPrice < maxCategoryPrice) && (
                <div className="border-t border-zinc-100 pt-4 space-y-2">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    {currentLang === "en" ? "Active Filters:" : "الفلاتر النشطة:"}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {searchQuery && (
                      <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md text-[10px]">
                        <span>{currentLang === "en" ? `Search: ${searchQuery}` : `بحث: ${searchQuery}`}</span>
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                      </span>
                    )}
                    {selectedSpecVal && (
                      <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md text-[10px]">
                        <span>{currentLang === "en" ? `Spec: ${selectedSpecVal.split(": ")[1]}` : `مواصفات: ${selectedSpecVal.split(": ")[1]}`}</span>
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedSpecVal("")} />
                      </span>
                    )}
                    {maxPrice < maxCategoryPrice && (
                      <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md text-[10px]">
                        <span>{currentLang === "en" ? `Price under: ${maxPrice}` : `سعر أقل من: ${maxPrice}`}</span>
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setMaxPrice(maxCategoryPrice)} />
                      </span>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Products Grid Section (3 Columns) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Sort & Stats Bar */}
            <div className="bg-white rounded-2xl px-6 py-4 border border-zinc-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 text-start">
              <div className="space-y-1">
                <span className="text-zinc-500 text-xs font-semibold">
                  {currentLang === "en" ? "Available Products:" : "المنتجات المتاحة:"}
                </span>
                <p className="text-zinc-900 text-sm font-extrabold">
                  {currentLang === "en" ? (
                    <>Showing <span className="text-[#3e499e] font-mono font-black">{filteredProducts.length}</span> of <span className="font-mono">{categoryProducts.length}</span> products</>
                  ) : (
                    <>عرض <span className="text-[#3e499e] font-mono font-black">{filteredProducts.length}</span> منتج من أصل <span className="font-mono">{categoryProducts.length}</span></>
                  )}
                </p>
              </div>

              {/* Dynamic tag helper badge */}
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#3e499e] animate-pulse"></span>
                <span className="text-xs text-zinc-500 font-medium">
                  {currentLang === "en" ? "Prices are indicative and negotiable for bulk orders" : "الأسعار استرشادية وقابلة للتفاوض للطلبيات"}
                </span>
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onSelect={onSelectProduct} 
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm p-12 text-center max-w-xl mx-auto space-y-6 my-12">
                <div className="bg-zinc-100 p-5 rounded-full inline-flex text-zinc-400">
                  <PackageX className="w-12 h-12" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-extrabold text-zinc-900 text-lg">
                    {currentLang === "en" ? "No Matching Products Found" : "لا توجد منتجات مطابقة للبحث"}
                  </h3>
                  <p className="text-zinc-500 text-xs leading-relaxed">
                    {currentLang === "en" 
                      ? "No products match your selected criteria in this category. Try adjusting or resetting your filters."
                      : "لم نجد أي منتجات مطابقة للخيارات المحددة في هذا القسم حاليًا. حاول تقليل فلاتر البحث أو حدد فئة أخرى."}
                  </p>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {currentLang === "en" ? "Show All Category Products" : "عرض جميع منتجات القسم"}
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
