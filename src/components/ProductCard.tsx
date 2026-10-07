import React, { useMemo, useState } from "react";
import { Product } from "../types";
import { MessageCircle, Eye, ShieldCheck, Heart } from "lucide-react";
import { useFavorites } from "../context/FavoritesContext";
import { useSiteContent } from "../context/SiteContentContext";
import { useTranslation } from "react-i18next";
import ContactMethodPicker from "./ContactMethodPicker";
import { getProductName, getProductShortDescription, getProductSpecs } from "../utils/localize";

interface ProductCardProps {
  key?: string | number;
  product: Product;
  onSelect: (productSlug: string) => void;
}

export default function ProductCard({ product, onSelect }: ProductCardProps) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const { getText } = useSiteContent();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "ar";
  const isProductContactEnabled = getText("product_contact_button_enabled", "true") !== "false";
  const [isContactPickerOpen, setIsContactPickerOpen] = useState(false);

  const localizedName = getProductName(product, currentLang);
  const localizedShortDesc = getProductShortDescription(product, currentLang);
  const localizedSpecs = getProductSpecs(product, currentLang);
  
  // Format message for the inquiry
  const productMessage = useMemo(() => {
    const productUrl = `${window.location.origin}/product/${product.slug}`;
    const availabilityNote = product.is_available === false 
      ? (currentLang === "en" ? "\n(Note: Item currently out of stock, inquiring on availability)" : "\n(ملاحظة: هذا المنتج غير متوفر حالياً في المعرض، وأود الاستفسار عن موعد توفره وإمكانية حجزه)")
      : "";
    return currentLang === "en"
      ? `Hello, I am interested in: ${localizedName}${availabilityNote}\nProduct URL: ${productUrl}`
      : `مرحبًا، أنا مهتم بمنتج: ${localizedName}${availabilityNote}\nرابط المنتج: ${productUrl}`;
  }, [product, currentLang, localizedName]);

  // Select 3 specifications to show as small badges/pills on the card
  const specEntries = Object.entries(localizedSpecs).slice(0, 3);

  return (
    <div 
      className="group bg-white rounded-2xl border border-zinc-200/80 hover:border-[#3e499e]/40 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative"
    >
      <div>
        {/* Product Image and badges */}
        <div className="relative h-56 w-full overflow-hidden bg-zinc-50 border-b border-zinc-100">
          <img
            src={product.images[0]}
            alt={localizedName}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
              product.is_available === false ? "opacity-60 grayscale-[30%]" : ""
            }`}
            referrerPolicy="no-referrer"
          />
          {/* Favorites toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(product);
            }}
            className="absolute top-4 left-4 z-20 p-2 bg-white/90 backdrop-blur-md text-zinc-500 hover:text-red-500 hover:scale-110 active:scale-95 rounded-xl border border-zinc-200/50 shadow-sm transition-all cursor-pointer"
            title={isFavorite(product.id) ? t("productCard.removeFromFavorites") : t("productCard.addToFavorites")}
          >
            <Heart 
              className={`w-4 h-4 transition-all ${
                isFavorite(product.id) 
                  ? "fill-red-500 text-red-500" 
                  : "text-zinc-500 hover:text-red-500"
              }`} 
            />
          </button>
          
          {/* Availability / Featured Badge */}
          {product.is_available === false ? (
            <div className="absolute top-4 right-4 z-10 bg-red-600 text-white text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-lg shadow-md animate-pulse">
              {t("productCard.outOfStock")}
            </div>
          ) : product.is_featured ? (
            <div className="absolute top-4 right-4 z-10 bg-zinc-900/90 backdrop-blur-md text-blue-300 border border-[#3e499e]/40 text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-lg shadow-sm">
              {t("productCard.featured")}
            </div>
          ) : null}

          {/* Protection/Warranty Badge */}
          <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-sm text-zinc-900 text-[10px] font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#3e499e]" />
            <span>{t("about.feature1Title")}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 text-start space-y-3.5">
          {/* Title */}
          <h3 
            onClick={() => onSelect(product.slug)}
            className="font-extrabold text-base text-zinc-900 hover:text-[#3e499e] transition-colors cursor-pointer leading-snug line-clamp-2"
          >
            {localizedName}
          </h3>

          {/* Short Description */}
          <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2">
            {localizedShortDesc}
          </p>

          {/* Quick Specifications list */}
          <div className="flex flex-wrap gap-2 pt-1">
            {specEntries.map(([key, value]) => (
              <span 
                key={key} 
                className="bg-zinc-100/85 text-zinc-600 border border-zinc-200/40 px-2 py-1 rounded text-[10px] font-medium"
              >
                <strong>{key}:</strong> {value}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing and Action Buttons */}
      <div className="p-5 pt-0">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100">
          <span className="text-zinc-400 text-xs font-semibold">
            {product.is_available === false ? t("productCard.outOfStock") : t("productCard.uponRequest")}
          </span>
          <div className="text-start">
            {product.is_available === false ? (
              <span className="text-red-600 font-extrabold text-[11px] bg-red-50 px-2 py-1 rounded-md border border-red-200/50">
                {t("productCard.outOfStock")}
              </span>
            ) : product.price ? (
              <span className="text-zinc-900 font-extrabold text-lg">
                {currentLang === "en" ? `${product.price.toLocaleString("en-US")} ` : `${product.price.toLocaleString("ar-EG")} `}
                <span className="text-xs text-zinc-500 font-normal">{t("productCard.currency")}</span>
              </span>
            ) : (
              <span className="text-zinc-500 text-xs font-bold">{t("productCard.uponRequest")}</span>
            )}
          </div>
        </div>

        {/* Action button triggers */}
        <div className={`grid gap-2 ${isProductContactEnabled ? "grid-cols-2" : "grid-cols-1"}`}>
          {/* Inquire on WhatsApp */}
          {isProductContactEnabled && (
            <button
              onClick={() => setIsContactPickerOpen(true)}
              className="flex items-center justify-center gap-1.5 font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer shadow-md bg-[#3e499e] hover:bg-[#323a7e] text-white"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>{t("productCard.contactOrder")}</span>
            </button>
          )}

          {/* View Details button */}
          <button
            onClick={() => onSelect(product.slug)}
            className="flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>{t("productCard.viewDetails")}</span>
          </button>
        </div>
      </div>

      {/* Contact Method Picker Modal */}
      <ContactMethodPicker 
        isOpen={isContactPickerOpen}
        onClose={() => setIsContactPickerOpen(false)}
        title={localizedName}
        subtitle={t("contact.subtitle")}
        customMessage={productMessage}
        customSubject={`Inquiry: ${localizedName}`}
      />
    </div>
  );
}
