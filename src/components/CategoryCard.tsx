import React from "react";
import { Category } from "../types";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getCategoryName, getCategoryDescription } from "../utils/localize";

interface CategoryCardProps {
  key?: string | number;
  category: Category;
  onSelect: (categorySlug: string) => void;
}

export default function CategoryCard({ category, onSelect }: CategoryCardProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "ar";

  const categoryName = getCategoryName(category, currentLang);
  const categoryDesc = getCategoryDescription(category, currentLang) || 
    (currentLang === "en" ? "Explore our professional selection in this category." : "استكشف مجموعتنا الاحترافية من المنتجات المتاحة لهذا القسم.");

  return (
    <div 
      onClick={() => onSelect(category.slug)}
      className="group relative bg-white rounded-2xl overflow-hidden border border-zinc-200/80 shadow-sm hover:shadow-xl hover:border-[#3e499e]/40 transition-all duration-300 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Category Image container */}
        <div className="relative h-48 w-full overflow-hidden bg-zinc-100">
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent z-10"></div>
          <img
            src={category.image_url}
            alt={categoryName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          
          {/* Product Count Badge */}
          <div className="absolute top-4 right-4 rtl:right-4 rtl:left-auto ltr:left-4 ltr:right-auto z-20 bg-[#3e499e] text-white font-black text-xs px-3 py-1 rounded-full shadow">
            {category.productCount || 0} {currentLang === "en" ? "Products" : "منتج"}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 text-start space-y-2">
          <h3 className="font-bold text-lg text-zinc-900 group-hover:text-[#3e499e] transition-colors">
            {categoryName}
          </h3>
          <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2">
            {categoryDesc}
          </p>
        </div>
      </div>

      {/* Footer link/button */}
      <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-zinc-50 text-xs font-semibold text-[#3e499e] group-hover:text-[#323a7e] transition-colors">
        <span>{currentLang === "en" ? "View Category Products" : "عرض منتجات القسم"}</span>
        {currentLang === "en" ? (
          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
        ) : (
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
        )}
      </div>
    </div>
  );
}
