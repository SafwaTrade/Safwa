import React from "react";
import { useSiteContent } from "../context/SiteContentContext";
import { companyInfo } from "../data/placeholder";
import { MessageSquare, Mail, X, PhoneCall } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ContactMethodPickerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  customMessage?: string;
  customSubject?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  showEmailOption?: boolean;
}

export default function ContactMethodPicker({
  isOpen,
  onClose,
  title,
  subtitle,
  customMessage,
  customSubject,
  recipientPhone,
  recipientEmail,
  showEmailOption = true
}: ContactMethodPickerProps) {
  const { getText } = useSiteContent();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "ar";

  if (!isOpen) return null;

  const modalTitle = title || t("contact.title");
  const modalSubtitle = subtitle || t("contact.subtitle");
  const defaultSubject = customSubject || (currentLang === "en" ? "Catalog Inquiry" : "استفسار من الموقع");

  const email = recipientEmail || getText("footer_email", companyInfo.email);
  const whatsapp = recipientPhone || getText("footer_whatsapp_number", companyInfo.whatsapp);
  const cleanWhatsapp = whatsapp.replace(/[^0-9]/g, "");

  const handleWhatsAppClick = () => {
    const defaultText = currentLang === "en"
      ? "Hello Al-Safwa, I would like to inquire about products and maintenance support."
      : "مرحباً الصفوة، أود الاستفسار وطلب الدعم بخصوص المنتجات والصيانة.";
    const text = encodeURIComponent(customMessage || defaultText);
    window.open(`https://wa.me/${cleanWhatsapp}?text=${text}`, "_blank", "noopener,noreferrer");
    onClose();
  };

  const handleEmailClick = () => {
    const subject = encodeURIComponent(defaultSubject);
    const body = encodeURIComponent(customMessage || "");
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-zinc-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl text-start text-white animate-in fade-in zoom-in-95 duration-250">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute end-4 top-4 text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-zinc-800 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-1.5 mb-6 pe-6">
          <h3 className="font-extrabold text-base text-zinc-100">{modalTitle}</h3>
          <p className="text-zinc-400 text-xs leading-relaxed">{modalSubtitle}</p>
        </div>

        {/* Methods List */}
        <div className="space-y-3">
          
          {/* WhatsApp Option */}
          <button
            onClick={handleWhatsAppClick}
            className="w-full flex items-center justify-between p-4 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 hover:border-[#3e499e]/40 rounded-xl transition-all cursor-pointer text-start group"
          >
            <div className="flex items-center gap-3.5 font-sans">
              <div className="bg-[#3e499e]/15 text-[#3e499e] p-2.5 rounded-xl border border-[#3e499e]/20 group-hover:bg-[#3e499e]/25 transition-all">
                <MessageSquare className="w-5 h-5 text-blue-400" />
              </div>
              <div className="space-y-0.5">
                <span className="block text-xs font-extrabold text-zinc-100">{t("contact.sendButton")} (WhatsApp)</span>
                <span className="block text-[10px] text-zinc-500 group-hover:text-zinc-400 transition-colors">Fast response & immediate support</span>
              </div>
            </div>
            <div className="text-zinc-600 group-hover:text-blue-400 transition-all">
              <PhoneCall className="w-4 h-4" />
            </div>
          </button>

          {/* Email Option */}
          {showEmailOption && (
            <button
              onClick={handleEmailClick}
              className="w-full flex items-center justify-between p-4 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 hover:border-[#3e499e]/40 rounded-xl transition-all cursor-pointer text-start group"
            >
              <div className="flex items-center gap-3.5 font-sans">
                <div className="bg-[#3e499e]/15 text-[#3e499e] p-2.5 rounded-xl border border-[#3e499e]/20 group-hover:bg-[#3e499e]/25 transition-all">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                <div className="space-y-0.5">
                  <span className="block text-xs font-extrabold text-zinc-100">{t("contact.sendButton")} (Email)</span>
                  <span className="block text-[10px] text-zinc-500 group-hover:text-zinc-400 transition-colors">Official inquiries & proposals</span>
                </div>
              </div>
              <div className="text-zinc-600 group-hover:text-blue-400 transition-all">
                <Mail className="w-4 h-4" />
              </div>
            </button>
          )}

        </div>

        {/* Footer info */}
        <div className="mt-5 pt-4 border-t border-zinc-800/60 text-center">
          <p className="text-[10px] text-zinc-500">
            {t("hero.fastSupport")}
          </p>
        </div>

      </div>
    </div>
  );
}
