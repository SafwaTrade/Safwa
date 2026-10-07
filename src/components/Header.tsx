import { useState } from "react";
import { companyInfo } from "../data/placeholder";
import { Wrench, Phone, MessageCircle, Menu, X, Search, Heart, Globe } from "lucide-react";
import { useFavorites } from "../context/FavoritesContext";
import { useSiteContent } from "../context/SiteContentContext";
import { useTranslation } from "react-i18next";
import ContactMethodPicker from "./ContactMethodPicker";

interface HeaderProps {
  onNavigateToContact: () => void;
  onNavigateToAbout: () => void;
  onNavigateToHome: () => void;
  onNavigateToFavorites: () => void;
  onNavigateToMaintenance: () => void;
  onScrollToSection?: (sectionId: string) => void;
}

export default function Header({ 
  onNavigateToContact, 
  onNavigateToAbout, 
  onNavigateToHome, 
  onNavigateToFavorites,
  onNavigateToMaintenance,
  onScrollToSection 
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { favorites } = useFavorites();
  const { getText } = useSiteContent();
  const { t, i18n } = useTranslation();

  const currentLang = i18n.language || "ar";

  const toggleLanguage = () => {
    const nextLang = currentLang === "ar" ? "en" : "ar";
    i18n.changeLanguage(nextLang);
  };

  const phone = getText("footer_phone", companyInfo.phone);
  const address = getText("footer_address", companyInfo.address);
  const badgeText = getText("top_bar_badge_text", t("header.topBadge"));
  const siteLogo = getText("site_logo", "");
  const isMaintenanceEnabled = getText("maintenance_feature_enabled", "true") !== "false";
  const isFeaturedEnabled = getText("featured_products_section_enabled", "true") !== "false";
  const isBrandsEnabled = getText("brands_section_enabled", "true") !== "false";
  const [isContactPickerOpen, setIsContactPickerOpen] = useState(false);
  const headerMessage = currentLang === "en" 
    ? "Hello Safwa, I would like to inquire about available catalog products." 
    : "مرحباً الصفوة، أرغب في الاستفسار عن كتالوج المنتجات المتاحة.";

  return (
    <header className="sticky top-0 z-50 bg-zinc-950 text-white shadow-md border-b border-zinc-800" id="app-header">
      {/* Top Bar for Contact Details */}
      <div className="hidden md:flex justify-between items-center bg-zinc-900 px-6 py-2 text-xs text-zinc-400 border-b border-zinc-800/50">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-[#3e499e]" />
            <span>{t("nav.contact")}: {phone}</span>
          </span>
          <span className="h-3 w-px bg-zinc-800" />
          <span className="text-zinc-400">{address}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white font-medium font-mono text-[10px] tracking-wider uppercase bg-[#3e499e] px-2.5 py-0.5 rounded-full shadow-sm">
            {badgeText}
          </span>
          {/* Language Toggle Button Top Bar */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-zinc-700 transition-colors cursor-pointer"
            title="Switch Language / تغيير اللغة"
          >
            <Globe className="w-3 h-3 text-blue-400" />
            <span>{currentLang === "ar" ? "English" : "عربي"}</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center gap-4">
          {/* Logo & Brand */}
          <button 
            onClick={onNavigateToHome}
            className="flex items-center gap-3 group text-start focus:outline-none cursor-pointer"
          >
            {siteLogo ? (
              <img 
                src={siteLogo} 
                alt={companyInfo.name} 
                className="h-11 max-w-[200px] object-contain rounded-lg"
              />
            ) : (
              <>
                <div className="bg-[#3e499e] text-white p-2.5 rounded-xl font-bold shadow-lg shadow-[#3e499e]/20 group-hover:bg-[#323a7e] transition-colors">
                  <Wrench className="w-6 h-6 rotate-45" />
                </div>
                <div>
                  <span className="block font-black text-xl tracking-tight text-white group-hover:text-blue-300 transition-colors">
                    {companyInfo.name}
                  </span>
                  <span className="block text-[10px] font-mono tracking-widest text-zinc-400 font-semibold uppercase">
                    {companyInfo.englishName}
                  </span>
                </div>
              </>
            )}
          </button>

          {/* Search Bar - Visual Mockup */}
          <div className="hidden lg:flex flex-1 max-w-md relative">
            <input
              type="text"
              placeholder={t("header.searchPlaceholder")}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#3e499e] transition-colors"
            />
            <Search className={`w-4 h-4 text-zinc-500 absolute ${currentLang === 'ar' ? 'left-3.5' : 'right-3.5'} top-1/2 -translate-y-1/2`} />
          </div>

          {/* Nav Links Desktop */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
            <button 
              onClick={onNavigateToHome} 
              className="text-white hover:text-blue-300 transition-colors cursor-pointer"
            >
              {t("nav.home")}
            </button>
            {isBrandsEnabled && (
              <button 
                onClick={() => {
                  if (onScrollToSection) {
                    onScrollToSection("brands-section");
                  } else {
                    const brandsSection = document.getElementById("brands-section");
                    if (brandsSection) brandsSection.scrollIntoView({ behavior: "smooth" });
                  }
                }} 
                className="text-zinc-300 hover:text-blue-300 transition-colors cursor-pointer"
              >
                {t("nav.brands")}
              </button>
            )}
            {isFeaturedEnabled && (
              <button 
                onClick={() => {
                  if (onScrollToSection) {
                    onScrollToSection("featured-products-section");
                  } else {
                    const prodSection = document.getElementById("featured-products-section");
                    if (prodSection) prodSection.scrollIntoView({ behavior: "smooth" });
                  }
                }} 
                className="text-zinc-300 hover:text-blue-300 transition-colors cursor-pointer"
              >
                {t("nav.featured")}
              </button>
            )}
            <button 
              onClick={onNavigateToAbout} 
              className="text-zinc-300 hover:text-blue-300 transition-colors cursor-pointer"
            >
              {t("nav.about")}
            </button>
            <button 
              onClick={onNavigateToContact} 
              className="text-zinc-300 hover:text-blue-300 transition-colors cursor-pointer"
            >
              {t("nav.contact")}
            </button>
            <button 
              onClick={onNavigateToFavorites} 
              className="relative text-zinc-300 hover:text-blue-300 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Heart className={`w-4 h-4 ${favorites.length > 0 ? 'fill-[#3e499e] text-[#3e499e]' : ''}`} />
              <span>{t("nav.favorites")}</span>
              {favorites.length > 0 && (
                <span className="bg-[#3e499e] text-white text-[10px] font-black rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </button>
          </nav>

          {/* Call to Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setIsContactPickerOpen(true)}
              className="flex items-center gap-2 bg-[#3e499e] hover:bg-[#323a7e] text-white font-bold px-4 py-2.5 rounded-lg text-xs shadow-lg shadow-[#3e499e]/20 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white text-[#3e499e]" />
              <span>{t("contact.sendButton")}</span>
            </button>
          </div>

          {/* Mobile Menu Button & Controls */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="bg-zinc-900 text-zinc-300 p-2 rounded-lg text-xs font-bold border border-zinc-800 flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>{currentLang === "ar" ? "EN" : "AR"}</span>
            </button>
            {isMaintenanceEnabled && (
              <button
                onClick={onNavigateToMaintenance}
                className="bg-zinc-900 text-zinc-400 p-2.5 rounded-lg hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                title={t("nav.maintenance")}
              >
                <Wrench className="w-5 h-5 text-blue-400" />
              </button>
            )}
            <button
              onClick={onNavigateToFavorites}
              className="relative bg-zinc-900 text-zinc-400 p-2.5 rounded-lg hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title={t("nav.favorites")}
            >
              <Heart className={`w-5 h-5 ${favorites.length > 0 ? 'fill-[#3e499e] text-[#3e499e]' : ''}`} />
              {favorites.length > 0 && (
                <span className="absolute -top-1.5 -left-1.5 bg-[#3e499e] text-white text-[9px] font-black rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="bg-zinc-900 text-zinc-400 p-2.5 rounded-lg hover:text-white hover:bg-zinc-850 transition-colors focus:outline-none cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-4 space-y-3 shadow-inner">
          {/* Mobile Search bar */}
          <div className="relative mb-3">
            <input
              type="text"
              placeholder={t("header.searchPlaceholder")}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#3e499e]"
            />
            <Search className={`w-4 h-4 text-zinc-500 absolute ${currentLang === 'ar' ? 'left-3.5' : 'right-3.5'} top-1/2 -translate-y-1/2`} />
          </div>

          <button
            onClick={() => {
              onNavigateToHome();
              setIsMobileMenuOpen(false);
            }}
            className="block w-full text-start py-2 text-sm text-zinc-300 hover:text-blue-300 transition-colors font-bold"
          >
            {t("nav.home")}
          </button>
          {isBrandsEnabled && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                if (onScrollToSection) {
                  onScrollToSection("brands-section");
                } else {
                  const brandsSection = document.getElementById("brands-section");
                  if (brandsSection) brandsSection.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="block w-full text-start py-2 text-sm text-zinc-300 hover:text-blue-300 transition-colors"
            >
              {t("nav.brands")}
            </button>
          )}
          {isFeaturedEnabled && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                if (onScrollToSection) {
                  onScrollToSection("featured-products-section");
                } else {
                  const prodSection = document.getElementById("featured-products-section");
                  if (prodSection) prodSection.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="block w-full text-start py-2 text-sm text-zinc-300 hover:text-blue-300 transition-colors"
            >
              {t("nav.featured")}
            </button>
          )}
          <button
            onClick={() => {
              onNavigateToAbout();
              setIsMobileMenuOpen(false);
            }}
            className="block w-full text-start py-2 text-sm text-zinc-300 hover:text-blue-300 transition-colors"
          >
            {t("nav.about")}
          </button>
          <button
            onClick={() => {
              onNavigateToContact();
              setIsMobileMenuOpen(false);
            }}
            className="block w-full text-start py-2 text-sm text-zinc-300 hover:text-blue-300 transition-colors"
          >
            {t("nav.contact")}
          </button>
          <button
            onClick={() => {
              onNavigateToFavorites();
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-start py-2 text-sm text-zinc-300 hover:text-blue-300 transition-colors flex items-center justify-between"
          >
            <span>{t("nav.favorites")}</span>
            {favorites.length > 0 && (
              <span className="bg-[#3e499e] text-white text-[10px] font-black rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                {favorites.length}
              </span>
            )}
          </button>

          <div className="pt-3 border-t border-zinc-800 flex flex-col gap-2">
            <div className="text-[11px] text-zinc-500 text-start">{t("nav.contact")}: {phone}</div>
            <button
              onClick={() => {
                setIsContactPickerOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="flex justify-center items-center gap-2 bg-[#3e499e] hover:bg-[#323a7e] text-white font-bold py-2.5 rounded-lg text-xs cursor-pointer w-full"
            >
              <MessageCircle className="w-4 h-4 fill-white text-[#3e499e]" />
              <span>{t("contact.sendButton")}</span>
            </button>
          </div>
        </div>
      )}

      <ContactMethodPicker
        isOpen={isContactPickerOpen}
        onClose={() => setIsContactPickerOpen(false)}
        title={t("contact.title")}
        subtitle={t("contact.subtitle")}
        customMessage={headerMessage}
        customSubject={t("header.searchPlaceholder")}
      />
    </header>
  );
}
