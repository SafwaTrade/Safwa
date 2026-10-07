import { useState } from "react";
import { companyInfo } from "../data/placeholder";
import { Category } from "../types";
import { useSiteContent } from "../context/SiteContentContext";
import { useTranslation } from "react-i18next";
import { getCategoryName } from "../utils/localize";
import ContactMethodPicker from "./ContactMethodPicker";
import { 
  Wrench, 
  Phone, 
  Mail, 
  MapPin, 
  MessageCircle, 
  ArrowUp,
  Facebook,
  Instagram,
  Linkedin
} from "lucide-react";

interface FooterProps {
  categories: Category[];
  onNavigateToHome: () => void;
  onNavigateToAbout: () => void;
  onNavigateToContact: () => void;
  onNavigateToMaintenance: () => void;
  onCategorySelect: (slug: string) => void;
}

export default function Footer({ 
  categories, 
  onNavigateToHome, 
  onNavigateToAbout, 
  onNavigateToContact, 
  onNavigateToMaintenance, 
  onCategorySelect 
}: FooterProps) {
  const { getText } = useSiteContent();
  const { t, i18n } = useTranslation();
  const [isContactPickerOpen, setIsContactPickerOpen] = useState(false);

  const phone = getText("footer_phone", companyInfo.phone);
  const email = getText("footer_email", companyInfo.email);
  const address = getText("footer_address", companyInfo.address);
  const whatsapp = getText("footer_whatsapp_number", companyInfo.whatsapp);
  const facebook = getText("footer_facebook", companyInfo.socials.facebook);
  const instagram = getText("footer_instagram", companyInfo.socials.instagram);
  const linkedin = getText("footer_linkedin", companyInfo.socials.linkedin);
  const siteLogo = getText("site_logo", "");

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-zinc-950 text-zinc-400 border-t border-zinc-800" id="app-footer">
      {/* Top Footer Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          
          {/* Company Bio (5 cols) */}
          <div className="lg:col-span-5 space-y-6 text-start">
            <div className="flex items-center gap-3">
              {siteLogo ? (
                <img 
                  src={siteLogo} 
                  alt={companyInfo.name} 
                  className="h-10 max-w-[200px] object-contain rounded-lg"
                />
              ) : (
                <>
                  <div className="bg-[#3e499e] text-white p-2 rounded-xl font-bold">
                    <Wrench className="w-5 h-5 rotate-45" />
                  </div>
                  <div>
                    <span className="block font-black text-lg tracking-tight text-white">
                      {companyInfo.name}
                    </span>
                    <span className="block text-[9px] font-mono tracking-wider text-zinc-500 font-semibold uppercase">
                      {companyInfo.englishName}
                    </span>
                  </div>
                </>
              )}
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-sm">
              {t("footer.description")}
            </p>
          </div>

          {/* Quick links (2 cols) */}
          <div className="lg:col-span-2 space-y-4 text-start">
            <h4 className="text-white font-extrabold text-sm tracking-wider uppercase border-s-2 border-[#3e499e] ps-2">
              {t("footer.quickLinks")}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={onNavigateToHome} className="hover:text-blue-300 transition-colors cursor-pointer text-start">
                  {t("nav.home")}
                </button>
              </li>
              <li>
                <button onClick={onNavigateToAbout} className="hover:text-blue-300 transition-colors cursor-pointer text-start">
                  {t("nav.about")}
                </button>
              </li>
              <li>
                <button onClick={onNavigateToContact} className="hover:text-blue-300 transition-colors cursor-pointer text-start">
                  {t("nav.contact")}
                </button>
              </li>
              {getText("maintenance_feature_enabled", "true") !== "false" && (
                <li>
                  <button onClick={onNavigateToMaintenance} className="hover:text-blue-300 transition-colors cursor-pointer text-start text-blue-400 font-bold">
                    {t("nav.maintenance")}
                  </button>
                </li>
              )}
              <li>
                <button 
                  onClick={() => {
                    onNavigateToHome();
                    setTimeout(() => {
                      const brandsSection = document.getElementById("brands-section");
                      if (brandsSection) brandsSection.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }} 
                  className="hover:text-blue-300 transition-colors cursor-pointer text-start"
                >
                  {t("nav.categories")}
                </button>
              </li>
            </ul>
          </div>

          {/* Categories links (2 cols) */}
          <div className="lg:col-span-2 space-y-4 text-start">
            <h4 className="text-white font-extrabold text-sm tracking-wider uppercase border-s-2 border-[#3e499e] ps-2">
              {t("nav.categories")}
            </h4>
            <ul className="space-y-2.5 text-sm">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <button 
                    onClick={() => onCategorySelect(cat.slug)}
                    className="hover:text-blue-300 transition-colors cursor-pointer text-start"
                  >
                    {getCategoryName(cat, i18n.language || "ar")}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details (3 cols) */}
          <div className="lg:col-span-3 space-y-4 text-start">
            <h4 className="text-white font-extrabold text-sm tracking-wider uppercase border-s-2 border-[#3e499e] ps-2">
              {t("footer.contactInfo")}
            </h4>
            <ul className="space-y-3.5 text-sm text-zinc-400">
              {address && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#3e499e] shrink-0 mt-0.5" />
                  <span className="leading-relaxed text-xs">{address}</span>
                </li>
              )}
              {phone && (
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#3e499e] shrink-0" />
                  <span className="font-mono text-xs">{phone}</span>
                </li>
              )}
              {email && (
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#3e499e] shrink-0" />
                  <span className="font-mono text-xs">{email}</span>
                </li>
              )}
              {whatsapp && (
                <li className="pt-2">
                  <button
                    onClick={() => setIsContactPickerOpen(true)}
                    className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-850 text-blue-300 hover:text-white font-bold px-4 py-2 rounded-xl text-xs border border-zinc-850 w-full justify-center cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-blue-300" />
                    <span>{t("contact.sendButton")}</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Footer Credits */}
      <div className="bg-zinc-950 border-t border-zinc-900 py-6 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-center sm:text-start">
            © {new Date().getFullYear()} {companyInfo.name}. {t("footer.rights")}
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-850 transition-colors"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <ContactMethodPicker 
        isOpen={isContactPickerOpen}
        onClose={() => setIsContactPickerOpen(false)}
        title={t("contact.title")}
        subtitle={t("contact.subtitle")}
        customMessage="Hello Safwa, I would like to inquire about products."
        customSubject="Catalog Inquiry"
      />
    </footer>
  );
}
