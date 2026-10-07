import React, { useState, useMemo, useEffect } from "react";
import { Product, Category } from "../types";
import { placeholderProducts, placeholderCategories, companyInfo } from "../data/placeholder";
import ProductCard from "./ProductCard";
import { useFavorites } from "../context/FavoritesContext";
import { useSiteContent } from "../context/SiteContentContext";
import ContactMethodPicker from "./ContactMethodPicker";
import { useTranslation } from "react-i18next";
import { 
  getCategoryName, 
  getProductName, 
  getProductShortDescription, 
  getProductFullDescription, 
  getProductSpecs, 
  getProductFeatures 
} from "../utils/localize";
import { 
  MessageCircle, 
  ChevronRight, 
  Info, 
  Settings, 
  ShieldCheck, 
  CornerDownRight, 
  Sparkles,
  Share2,
  Copy,
  Check,
  Heart
} from "lucide-react";

interface ProductDetailPageProps {
  product: Product;
  onNavigateToHome: () => void;
  onNavigateToCategory: (slug: string) => void;
  onSelectProduct: (slug: string) => void;
  categories?: Category[];
  products?: Product[];
}

export default function ProductDetailPage({ 
  product, 
  onNavigateToHome, 
  onNavigateToCategory,
  onSelectProduct,
  categories = placeholderCategories,
  products = placeholderProducts
}: ProductDetailPageProps) {
  
  // Gallery state: index of active image
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isContactPickerOpen, setIsContactPickerOpen] = useState(false);

  const { toggleFavorite, isFavorite } = useFavorites();
  const { getText } = useSiteContent();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "ar";

  const localizedName = getProductName(product, currentLang);
  const localizedShortDesc = getProductShortDescription(product, currentLang);
  const localizedFullDesc = getProductFullDescription(product, currentLang);
  const localizedSpecs = getProductSpecs(product, currentLang);

  // Features to display (fallback to defaults if empty)
  const displayFeatures = useMemo(() => {
    const localizedFeats = getProductFeatures(product, currentLang);
    if (localizedFeats && localizedFeats.length > 0) {
      return localizedFeats;
    }
    return currentLang === "en" ? [
      "Official Certified Warranty",
      "Original Spare Parts & Support Available"
    ] : [
      "ضمان أصلي معتمد لجميع الأجهزة",
      "توفر دائم لقطع الغيار الأصلية والصيانة"
    ];
  }, [product, currentLang]);
  const isProductContactEnabled = getText("product_contact_button_enabled", "true") !== "false";

  // When product changes, reset active image index
  useEffect(() => {
    setActiveImageIndex(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [product.id]);

  // Find category info
  const category = useMemo(() => {
    return categories.find(c => c.id === product.category_id);
  }, [product.category_id, categories]);

  // Find 3-4 related products (excluding the current one)
  const relatedProducts = useMemo(() => {
    return products
      .filter(p => p.category_id === product.category_id && p.id !== product.id)
      .slice(0, 4);
  }, [product.category_id, product.id, products]);

  // Message preparation
  const productMessage = useMemo(() => {
    const productUrl = `${window.location.origin}/product/${product.slug}`;
    const availabilityNote = product.is_available === false 
      ? "\n(ملاحظة: هذا المنتج غير متوفر حالياً في المعرض، وأود الاستفسار عن موعد توفره وإمكانية حجزه)" 
      : "";
    return `مرحبًا، أنا مهتم بمنتج: ${product.name}${availabilityNote}\nرابط المنتج: ${productUrl}`;
  }, [product]);

  // Handle sharing or copying link
  const copyTextToClipboard = async (text: string): Promise<boolean> => {
    // Attempt standard navigator.clipboard
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (err) {
      console.warn("navigator.clipboard.writeText failed, using fallback:", err);
    }

    // Fallback using temporary textarea
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      // Position offscreen
      textarea.style.position = "fixed";
      textarea.style.top = "0";
      textarea.style.left = "0";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (success) return true;
    } catch (err) {
      console.error("Fallback copy failed:", err);
    }
    return false;
  };

  const handleCopyLink = async () => {
    const dummyUrl = `${window.location.origin}/product/${product.slug}`;
    const success = await copyTextToClipboard(dummyUrl);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Handle sharing with Web Share API or fallback
  const handleShare = async () => {
    const productUrl = `${window.location.origin}/product/${product.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.short_description || `استكشف منتج: ${product.name}`,
          url: productUrl,
        });
      } catch (error) {
        console.log("Error sharing:", error);
        // Fallback if sharing is aborted or fails
        const success = await copyTextToClipboard(productUrl);
        if (success) {
          setCopiedLink(true);
          setTimeout(() => setCopiedLink(false), 2000);
        }
      }
    } else {
      const success = await copyTextToClipboard(productUrl);
      if (success) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    }
  };

  // Gallery images list (ensure there is at least one image)
  const images = useMemo(() => {
    return product.images && product.images.length > 0 
      ? product.images 
      : ["https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=800"];
  }, [product.images]);

  return (
    <div className="bg-zinc-50 min-h-screen py-8 text-right" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-8 font-medium">
          <button 
            onClick={onNavigateToHome}
            className="hover:text-[#3e499e] transition-colors cursor-pointer"
          >
            {t("nav.home")}
          </button>
          <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          {category && (
            <>
              <button 
                onClick={() => onNavigateToCategory(category.slug)}
                className="hover:text-[#3e499e] transition-colors cursor-pointer"
              >
                {getCategoryName(category, currentLang)}
              </button>
              <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </>
          )}
          <span className="text-zinc-900 font-bold line-clamp-1">{localizedName}</span>
        </nav>

        {/* Product Showcase Card */}
        <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm overflow-hidden mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8 lg:p-10">
            
            {/* Right: Images Gallery (5 Columns) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Main Image Frame */}
              <div className="relative aspect-square w-full rounded-2xl bg-zinc-50 overflow-hidden border border-zinc-150 group">
                <span className="absolute top-4 right-4 z-15 bg-zinc-900/85 backdrop-blur-sm text-blue-300 text-[10px] font-mono font-bold px-3 py-1 rounded-full">
                  {currentLang === "en" ? "Product Photo" : "صورة حقيقية للمنتج"}
                </span>
                <img 
                  src={images[activeImageIndex]} 
                  alt={localizedName} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Thumbnails Row */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
                  {images.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative aspect-square w-20 flex-shrink-0 rounded-xl overflow-hidden bg-zinc-50 border-2 transition-all cursor-pointer ${
                        activeImageIndex === idx 
                          ? "border-[#3e499e] ring-2 ring-[#3e499e]/10 shadow-sm" 
                          : "border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      <img 
                        src={imgUrl} 
                        alt={`${localizedName} - ${idx + 1}`} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Left: Product Info Details (7 Columns) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              
              {/* Title, Category & Badges */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {category && (
                    <button
                      onClick={() => onNavigateToCategory(category.slug)}
                      className="text-xs bg-[#3e499e]/10 text-[#3e499e] hover:bg-[#3e499e]/20 font-extrabold px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                    >
                      {getCategoryName(category, currentLang)}
                    </button>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleFavorite(product)}
                      className={`p-2.5 rounded-xl transition-all cursor-pointer border flex items-center gap-2 text-xs font-bold ${
                        isFavorite(product.id)
                          ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                          : "bg-zinc-50 border-zinc-150 text-zinc-500 hover:text-zinc-750 hover:bg-zinc-100"
                      }`}
                      title={isFavorite(product.id) ? (currentLang === "en" ? "Remove from Favorites" : "إزالة من المفضلة") : (currentLang === "en" ? "Add to Favorites" : "إضافة للمفضلة")}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite(product.id) ? "fill-red-600 text-red-600" : ""}`} />
                      <span>{isFavorite(product.id) ? (currentLang === "en" ? "In Favorites" : "في المفضلة") : (currentLang === "en" ? "Add to Favorites" : "إضافة للمفضلة")}</span>
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="p-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 rounded-xl transition-all cursor-pointer border border-zinc-150"
                      title={currentLang === "en" ? "Copy Product Link" : "نسخ رابط المنتج"}
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 leading-tight">
                  {localizedName}
                </h1>

                {/* Price tag block */}
                <div className="flex flex-wrap items-center gap-3.5">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-zinc-500 text-xs font-semibold">{currentLang === "en" ? "Price:" : "سعر المنتج المقترح:"}</span>
                    <span className="text-3xl font-mono font-black text-[#3e499e]">
                      {product.price ? `${product.price.toLocaleString(currentLang === "en" ? "en-US" : "ar-EG")} ${currentLang === "en" ? "EGP" : "ج.م"}` : (currentLang === "en" ? "Contact for price" : "تواصل لمعرفة السعر")}
                    </span>
                  </div>

                  {product.is_available === false && (
                    <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-black px-3 py-1.5 rounded-xl animate-pulse">
                      <span className="h-2 w-2 rounded-full bg-red-600"></span>
                      <span>{currentLang === "en" ? "Currently Out of Stock" : "غير متوفر حالياً بالمخزن"}</span>
                    </span>
                  )}
                </div>

                <hr className="border-zinc-100" />

                {/* Description */}
                <div className="space-y-2">
                  <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">{currentLang === "en" ? "Product Details & Description" : "تفاصيل ووصف المنتج"}</h3>
                  <p className="text-zinc-700 text-sm sm:text-base leading-relaxed font-normal whitespace-pre-line">
                    {localizedFullDesc || localizedShortDesc}
                  </p>
                </div>
              </div>

              {/* Trust badges and CTAs */}
              <div className="space-y-6 pt-6 border-t border-zinc-100">
                
                {/* Highlights list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-50/50 p-4 rounded-2xl border border-zinc-150/50">
                  {displayFeatures.map((feat, i) => {
                    const isEven = i % 2 === 0;
                    return (
                      <div key={i} className="flex items-center gap-2.5 text-xs text-zinc-700 font-bold">
                        {isEven ? (
                          <ShieldCheck className="w-4.5 h-4.5 text-[#3e499e] shrink-0" />
                        ) : (
                          <Sparkles className="w-4.5 h-4.5 text-[#3e499e] shrink-0" />
                        )}
                        <span>{feat}</span>
                      </div>
                    );
                  })}
                </div>

                {/* WhatsApp Action Button & Share Button */}
                <div className="flex flex-col lg:flex-row gap-3">
                  {isProductContactEnabled && (
                    <button 
                      onClick={() => setIsContactPickerOpen(true)}
                      className="flex-[2] flex items-center justify-center gap-3 active:scale-[0.98] transition-all text-white font-black py-4 px-6 rounded-2xl shadow-lg cursor-pointer text-sm bg-[#3e499e] hover:bg-[#323a7e]"
                    >
                      <MessageCircle className="w-5 h-5 fill-white" />
                      <span>{product.is_available === false ? (currentLang === "en" ? "Inquire Availability" : "استفسر عن توفر المنتج وموعد وصوله") : (currentLang === "en" ? "Contact & Order" : "تواصل للاستفسار والطلب")}</span>
                    </button>
                  )}

                  <button
                    onClick={handleShare}
                    className="flex-1 flex items-center justify-center gap-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-zinc-900/10 transition-all cursor-pointer active:scale-[0.98] text-sm"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-5 h-5 text-blue-300" />
                        <span>{currentLang === "en" ? "Link Copied!" : "تم نسخ الرابط!"}</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-5 h-5" />
                        <span>{currentLang === "en" ? "Share Product" : "مشاركة المنتج"}</span>
                      </>
                    )}
                  </button>
                  
                  <button 
                    onClick={() => category && onNavigateToCategory(category.slug)}
                    className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-4 px-6 rounded-2xl transition-all cursor-pointer text-sm"
                  >
                    {currentLang === "en" ? "Browse Category" : "تصفح المزيد"}
                  </button>
                </div>

              </div>

            </div>
          </div>
        </div>

        {/* Specifications Tab Table */}
        {localizedSpecs && Object.keys(localizedSpecs).length > 0 && (
          <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm p-6 sm:p-8 mb-12">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-4 mb-6">
              <Info className="w-5 h-5 text-[#3e499e]" />
              <h2 className="text-lg font-extrabold text-zinc-950">{currentLang === "en" ? "Technical Specifications" : "المواصفات الفنية وجدول القياسات"}</h2>
            </div>
            
            <div className="overflow-hidden border border-zinc-150 rounded-2xl">
              <table className="w-full text-right border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-150">
                    <th className="px-6 py-4 font-black text-zinc-700 w-1/3">{currentLang === "en" ? "Specification / Feature" : "المعيار / الخاصية"}</th>
                    <th className="px-6 py-4 font-black text-zinc-700">{currentLang === "en" ? "Value & Detail" : "القيمة والبيان"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {Object.entries(localizedSpecs).map(([key, val], idx) => (
                    <tr 
                      key={key} 
                      className={`transition-colors hover:bg-zinc-50/50 ${idx % 2 === 0 ? "bg-white" : "bg-zinc-50/20"}`}
                    >
                      <td className="px-6 py-4 font-extrabold text-zinc-900 border-l border-zinc-100">{key}</td>
                      <td className="px-6 py-4 text-zinc-600 font-medium font-mono">{String(val)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#3e499e]" />
                <h2 className="text-xl font-black text-zinc-950">منتجات قد تعجبك أيضًا</h2>
              </div>
              {category && (
                <button 
                  onClick={() => onNavigateToCategory(category.slug)}
                  className="text-xs text-[#3e499e] hover:text-[#323a7e] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>{currentLang === "en" ? `View all in ${getCategoryName(category, currentLang)}` : `عرض الكل في ${getCategoryName(category, currentLang)}`}</span>
                  <CornerDownRight className="w-3.5 h-3.5 rotate-180" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  onSelect={onSelectProduct} 
                />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Contact Method Picker Modal */}
      <ContactMethodPicker 
        isOpen={isContactPickerOpen}
        onClose={() => setIsContactPickerOpen(false)}
        title={`استفسار بخصوص ${product.name}`}
        subtitle="اختر القناة المفضلة لديك للتواصل مع فريق الدعم الفني للصفوة"
        customMessage={productMessage}
        customSubject={`استفسار بخصوص منتج: ${product.name}`}
      />
    </div>
  );
}
