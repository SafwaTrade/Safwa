import React, { useMemo, useState } from "react";
import { companyInfo } from "../data/placeholder";
import { Hammer, Star, ShieldCheck, HelpCircle, Wrench } from "lucide-react";
import { useSiteContent } from "../context/SiteContentContext";
import { useTranslation } from "react-i18next";
import { Product } from "../types";
import ContactMethodPicker from "./ContactMethodPicker";

interface HeroProps {
  onExploreCatalog: () => void;
  onContactUs: () => void;
  onNavigateToMaintenance?: () => void;
  products?: Product[];
}

export default function Hero({ onExploreCatalog, onContactUs, onNavigateToMaintenance, products = [] }: HeroProps) {
  const { getText } = useSiteContent();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "ar";
  const isMaintenanceEnabled = getText("maintenance_feature_enabled", "true") !== "false";
  const isProductContactEnabled = getText("product_contact_button_enabled", "true") !== "false";
  const [isContactPickerOpen, setIsContactPickerOpen] = useState(false);

  // Dynamically calculate stock status based on actual products availability
  const stockStatusText = useMemo(() => {
    if (!products || products.length === 0) {
      return currentLang === "en" ? "All products in stock" : "جميع المنتجات متوفرة للتسليم";
    }
    const hasUnavailable = products.some(p => p.is_available === false);
    if (hasUnavailable) {
      return currentLang === "en" ? "Most products in stock" : "معظم المنتجات متوفرة للتسليم";
    }
    return currentLang === "en" ? "All products in stock" : "جميع المنتجات متوفرة للتسليم";
  }, [products, currentLang]);

  return (
    <section className="bg-zinc-950 text-white relative overflow-hidden py-16 md:py-24" id="app-hero">
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:16px_16px]"></div>
      
      {/* Ambient glow */}
      <div className="absolute -left-48 -top-48 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -right-48 -bottom-48 w-96 h-96 bg-orange-650/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Text content (7 cols on large screens) */}
          <div className="lg:col-span-7 space-y-8 text-start">
            <div className="inline-flex items-center gap-2 bg-[#3e499e]/20 border border-[#3e499e]/40 px-3.5 py-1.5 rounded-full text-blue-200 text-xs font-semibold">
              <Hammer className="w-3.5 h-3.5 text-blue-300" />
              <span>{getText("home_hero_badge", t("hero.badge"))}</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
                {getText("home_hero_title", companyInfo.name)} <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-blue-300 via-blue-200 to-white">
                  {getText("home_hero_tagline", companyInfo.tagline)}
                </span>
              </h1>
              <p className="text-zinc-300 text-base sm:text-lg max-w-xl leading-relaxed">
                {getText("home_hero_description", t("hero.subtitle"))}
              </p>
            </div>

            {/* Core features bullet points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              <div className="flex items-center gap-3 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800/40">
                <ShieldCheck className="w-5 h-5 text-[#3e499e] shrink-0" />
                <span className="text-sm font-medium text-zinc-300">{t("about.feature1Title")}</span>
              </div>
              <div className="flex items-center gap-3 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800/40">
                <Star className="w-5 h-5 text-[#3e499e] shrink-0" />
                <span className="text-sm font-medium text-zinc-300">{t("about.feature2Title")}</span>
              </div>
              <div className="flex items-center gap-3 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800/40">
                <HelpCircle className="w-5 h-5 text-[#3e499e] shrink-0" />
                <span className="text-sm font-medium text-zinc-300">{t("hero.fastSupport")}</span>
              </div>
              <div className="flex items-center gap-3 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800/40">
                <Wrench className="w-5 h-5 text-[#3e499e] shrink-0" />
                <span className="text-sm font-medium text-zinc-300">{t("about.feature3Title")}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onExploreCatalog}
                className="bg-[#3e499e] hover:bg-[#323a7e] text-white font-bold px-8 py-3.5 rounded-xl text-sm shadow-xl shadow-[#3e499e]/25 transition-all cursor-pointer transform hover:-translate-y-0.5"
              >
                {t("hero.searchButton")}
              </button>
              <button
                onClick={() => {
                  if (isMaintenanceEnabled && onNavigateToMaintenance) {
                    onNavigateToMaintenance();
                  } else {
                    setIsContactPickerOpen(true);
                  }
                }}
                className="bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-850 px-8 py-3.5 rounded-xl text-sm transition-all cursor-pointer hover:border-zinc-700"
              >
                {isMaintenanceEnabled ? t("nav.maintenance") : t("nav.contact")}
              </button>
            </div>
          </div>

          {/* Image Banner mockup (5 cols on large screens) */}
          <div className="lg:col-span-5 relative mt-6 lg:mt-0">
            {/* Visual element frame */}
            <div className="absolute -inset-1.5 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-2xl blur opacity-25"></div>
            <div className="relative bg-zinc-900 p-2.5 rounded-2xl border border-zinc-800 shadow-2xl">
              <img
                src={getText("home_hero_image", "/src/assets/images/industrial_tools_hero_1783623168872.jpg")}
                alt="Al-Safwa Premium Industrial Tools"
                className="w-full h-auto object-cover rounded-xl shadow-inner max-h-[360px]"
                referrerPolicy="no-referrer"
              />
              {/* Overlay sticker for premium design */}
              {isProductContactEnabled && (
                <div className="absolute bottom-6 end-6 bg-zinc-950/90 backdrop-blur-md px-4 py-3 rounded-xl border border-zinc-800/80 shadow-lg">
                  <div className="flex items-center gap-3 text-start">
                    <span className="flex h-3 w-3 relative">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        stockStatusText.includes("معظم") || stockStatusText.includes("Most") ? "bg-amber-400" : "bg-emerald-400"
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${
                        stockStatusText.includes("معظم") || stockStatusText.includes("Most") ? "bg-amber-500" : "bg-emerald-500"
                      }`}></span>
                    </span>
                    <div>
                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">STOCK STATUS</div>
                      <div className={`text-xs font-bold ${
                        stockStatusText.includes("معظم") || stockStatusText.includes("Most") ? "text-amber-400" : "text-emerald-400"
                      }`}>{stockStatusText}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Contact Method Picker Modal */}
      <ContactMethodPicker 
        isOpen={isContactPickerOpen}
        onClose={() => setIsContactPickerOpen(false)}
        title={t("contact.title")}
        subtitle={t("contact.subtitle")}
      />
    </section>
  );
}
