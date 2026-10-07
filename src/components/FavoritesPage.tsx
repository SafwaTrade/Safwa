import React, { useMemo, useState } from "react";
import { useFavorites } from "../context/FavoritesContext";
import { companyInfo } from "../data/placeholder";
import ProductCard from "./ProductCard";
import ContactMethodPicker from "./ContactMethodPicker";
import { useTranslation } from "react-i18next";
import { getProductName } from "../utils/localize";
import { 
  Heart, 
  MessageCircle, 
  ArrowLeft, 
  Trash2, 
  ChevronRight, 
  Sparkles,
  ShoppingBag
} from "lucide-react";

interface FavoritesPageProps {
  onNavigateToHome: () => void;
  onSelectProduct: (slug: string) => void;
}

export default function FavoritesPage({ onNavigateToHome, onSelectProduct }: FavoritesPageProps) {
  const { favorites, removeFavorite, clearFavorites } = useFavorites();
  const [isContactPickerOpen, setIsContactPickerOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "ar";

  // Construct consolidated Message
  const favoritesMessage = useMemo(() => {
    if (favorites.length === 0) return "";
    
    if (favorites.length === 1) {
      const productUrl = `${window.location.origin}/product/${favorites[0].slug}`;
      const prodName = getProductName(favorites[0], currentLang);
      const availText = favorites[0].is_available === false 
        ? (currentLang === "en" ? " (Currently unavailable, inquiring on arrival)" : " (غير متوفر حالياً وبحاجة للاستفسار)") 
        : "";
      return currentLang === "en" 
        ? `Hello, I am interested in product: ${prodName}${availText}\nProduct link: ${productUrl}`
        : `مرحبًا، أنا مهتم بمنتج: ${prodName}${availText}\nرابط المنتج: ${productUrl}`;
    } else {
      const productList = favorites.map((p, idx) => {
        const productUrl = `${window.location.origin}/product/${p.slug}`;
        const prodName = getProductName(p, currentLang);
        const availText = p.is_available === false 
          ? (currentLang === "en" ? " (Unavailable)" : " (غير متوفر حالياً وبحاجة للاستفسار)") 
          : "";
        return `${idx + 1}. ${prodName}${availText} - ${productUrl}`;
      }).join("\n");
      return currentLang === "en" 
        ? `Hello, I am interested in the following products:\n${productList}`
        : `مرحبًا، أنا مهتم بالمنتجات التالية:\n${productList}`;
    }
  }, [favorites, currentLang]);

  return (
    <div className="bg-zinc-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-8 font-medium">
          <button 
            onClick={onNavigateToHome}
            className="hover:text-[#3e499e] transition-colors cursor-pointer"
          >
            {currentLang === "en" ? "Home" : "الرئيسية"}
          </button>
          <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          <span className="text-zinc-900 font-bold">
            {currentLang === "en" ? "Favorites & Wishlist" : "المفضلة وقائمة الاهتمام"}
          </span>
        </nav>

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-200 pb-6 mb-8 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="bg-[#3e499e]/10 p-2 rounded-xl text-[#3e499e]">
                <Heart className="w-6 h-6 fill-[#3e499e] stroke-[#3e499e]" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">
                {currentLang === "en" ? "Favorite Products" : "المنتجات المفضلة"}
              </h1>
            </div>
            <p className="text-zinc-500 text-xs sm:text-sm">
              {currentLang === "en" 
                ? "Your saved collection of tools and products. Inquire about them all with a single click."
                : "مجموعتك الخاصة من الأدوات والمنتجات التي لفتت انتباهك. يمكنك الاستفسار عنها مجمعة بضغطة زر واحدة."}
            </p>
          </div>

          {favorites.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={clearFavorites}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 hover:border-red-200 hover:bg-red-50 text-zinc-600 hover:text-red-600 text-xs font-bold transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{currentLang === "en" ? "Clear All Favorites" : "مسح كل المفضلة"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Empty state or Product List */}
        {favorites.length > 0 ? (
          <div className="space-y-8">
            
            {/* Multi-item WhatsApp Action Card */}
            <div className="bg-gradient-to-r from-[#3e499e] to-indigo-900 rounded-3xl text-white p-6 sm:p-8 shadow-xl shadow-[#3e499e]/15 border border-indigo-800/50 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-2 max-w-2xl text-start">
                <span className="inline-block bg-blue-500/30 text-blue-100 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-blue-400/20">
                  {currentLang === "en" ? "Instant Bulk Order Inquiry" : "طلب مجمع فوري"}
                </span>
                <h2 className="text-xl sm:text-2xl font-black">
                  {currentLang === "en" 
                    ? "Inquire about all your favorite items at once!"
                    : "استفسر عن كافة منتجاتك المفضلة دفعة واحدة!"}
                </h2>
                <p className="text-blue-100/90 text-xs sm:text-sm leading-relaxed">
                  {currentLang === "en"
                    ? `You have added ${favorites.length} products to your list. Send a single bulk message to get a custom quote.`
                    : `لقد قمت بإضافة ${favorites.length} من الأدوات والمنتجات إلى قائمتك. يمكنك إرسالها كلها في رسالة واحدة مجمعة للصفوة لنقوم بتجهيز عرض أسعار مخصص لك.`}
                </p>
              </div>

              <button 
                onClick={() => setIsContactPickerOpen(true)}
                className="w-full md:w-auto inline-flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-[#3e499e] hover:scale-[1.02] active:scale-[0.98] px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-md cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-[#3e499e] stroke-[#3e499e]" />
                <span>
                  {currentLang === "en" 
                    ? `Inquire about products (${favorites.length})` 
                    : `تواصل للاستفسار عن المنتجات (${favorites.length})`}
                </span>
              </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {favorites.map((product) => (
                <div key={product.id} className="relative group">
                  {/* Overlay Remove Button */}
                  <button
                    onClick={() => removeFavorite(product.id)}
                    className="absolute top-3 left-3 z-20 p-2.5 bg-white/90 backdrop-blur-md hover:bg-red-50 text-zinc-500 hover:text-red-600 rounded-xl border border-zinc-200/50 shadow-sm transition-all cursor-pointer opacity-90 hover:scale-105"
                    title={currentLang === "en" ? "Remove from Favorites" : "إزالة من المفضلة"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ProductCard 
                    product={product} 
                    onSelect={onSelectProduct} 
                  />
                </div>
              ))}
            </div>

          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm p-12 text-center max-w-xl mx-auto space-y-6 my-16">
            <div className="bg-[#3e499e]/10 p-6 rounded-full inline-flex text-[#3e499e] ring-4 ring-[#3e499e]/5">
              <ShoppingBag className="w-14 h-14" />
            </div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-zinc-900 text-lg">
                {currentLang === "en" ? "No Favorites Yet" : "لسه مفيش منتجات في المفضلة"}
              </h3>
              <p className="text-zinc-500 text-xs leading-relaxed">
                {currentLang === "en" 
                  ? "Your favorites list is currently empty. Browse our catalog and click the heart icon on any product to save it here."
                  : "قائمتك المفضلة فارغة حاليًا. تصفح كتالوج الأدوات والمنتجات الكهربائية المميزة واضغط على علامة القلب لإضافة ما يعجبك هنا والرجوع إليه لاحقًا."}
              </p>
            </div>
            <button
              onClick={onNavigateToHome}
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-black px-8 py-3.5 rounded-2xl text-xs transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              {currentLang === "en" ? "Browse Products Catalog" : "الذهاب لتصفح المنتجات"}
            </button>
          </div>
        )}

      </div>

      {/* Contact Method Picker Modal */}
      <ContactMethodPicker 
        isOpen={isContactPickerOpen}
        onClose={() => setIsContactPickerOpen(false)}
        title={currentLang === "en" ? "Bulk Favorites Inquiry" : "استفسار مجمع عن المنتجات المفضلة"}
        subtitle={currentLang === "en" ? "Select your preferred channel to receive a custom quote" : "اختر قناتك المفضلة لإرسال قائمة المنتجات التي حددتها والحصول على عرض أسعار مخصص"}
        customMessage={favoritesMessage}
        customSubject={currentLang === "en" ? `Bulk Inquiry (${favorites.length} items)` : `استفسار مجمع (${favorites.length} منتج)`}
      />
    </div>
  );
}
