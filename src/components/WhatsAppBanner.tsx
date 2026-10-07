import { useState } from "react";
import { companyInfo } from "../data/placeholder";
import { MessageCircle, ShieldAlert, Sparkles, PhoneCall } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSiteContent } from "../context/SiteContentContext";
import ContactMethodPicker from "./ContactMethodPicker";

export default function WhatsAppBanner() {
  const [isContactPickerOpen, setIsContactPickerOpen] = useState(false);
  const { i18n } = useTranslation();
  const { getText } = useSiteContent();
  const currentLang = i18n.language || "ar";

  const defaultBadge = currentLang === "en" ? "Corporate & Retail Store Supply Requests" : "قسم التوريدات والطلبات الخاصة للشركات والمتاجر";
  const defaultTitle = currentLang === "en" ? "Looking for Bulk Supplies or Equipping Stores & Companies?" : "هل تبحث عن توريد كميات أو تجهيز متجر وشركة بالكامل؟";
  const defaultDesc = currentLang === "en"
    ? "We offer special price quotes and supply facilities for companies, stores, and retailers at competitive prices with official warranty."
    : "نوفر عروض أسعار خاصة وتسهيلات توريد للشركات والمتاجر والتجار بأسعار تنافسية وضمان رسمي معتمد مع إمكانية توفير أصناف خاصة بطلب مباشر.";
  const defaultQuoteBtn = currentLang === "en" ? "Request Quotation & Supply" : "طلب تسعيرة وتوريد خاص";
  const defaultCallBtn = currentLang === "en" ? "Direct Call to Sales" : "الاتصال المباشر بالمبيعات";
  const defaultNote = currentLang === "en" ? "We provide official tax invoices and genuine spare parts for all corporate supplies." : "نلتزم بتوفير فواتير رسمية معتمدة وقطع غيار أصلية لجميع التوريدات";

  const bannerMessage = currentLang === "en"
    ? `Hello ${companyInfo.englishName || companyInfo.name}, I would like to inquire about bulk ordering / corporate quotation:\n\nPlease contact me with available pricing and specs.`
    : `مرحباً ${companyInfo.name}، أود الاستفسار وطلب تسعيرة بخصوص:\n- طلب توريد كميات للشركات / المتاجر\n\nيرجى التواصل معي بالأسعار والمواصفات المتاحة.`;

  return (
    <section className="bg-gradient-to-l from-zinc-950 to-zinc-900 border-t border-b border-zinc-800 text-white py-12 relative overflow-hidden" id="whatsapp-cta">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#3e499e_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-start">
          
          {/* Main Title / Copy */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 bg-[#3e499e]/20 border border-[#3e499e]/40 px-3 py-1 rounded-full text-blue-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>{getText("corporate_banner_badge", defaultBadge)}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-snug whitespace-pre-line">
              {getText("corporate_banner_title", defaultTitle)}
            </h2>
            <p className="text-zinc-400 text-sm max-w-xl leading-relaxed whitespace-pre-line">
              {getText("corporate_banner_desc", defaultDesc)}
            </p>
          </div>

          {/* Quick Buttons for predefined topics */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row gap-3 justify-start lg:justify-end">
            <button
              onClick={() => setIsContactPickerOpen(true)}
              className="flex items-center justify-center gap-2 bg-[#3e499e] hover:bg-[#323a7e] text-white font-bold px-6 py-3.5 rounded-xl text-sm shadow-xl shadow-[#3e499e]/20 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-white text-[#3e499e]" />
              <span>{getText("corporate_banner_btn_quote", defaultQuoteBtn)}</span>
            </button>

            <a
              href={`tel:${companyInfo.phone}`}
              className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-100 border border-zinc-700/80 font-bold px-6 py-3.5 rounded-xl text-sm transition-colors cursor-pointer"
            >
              <PhoneCall className="w-4 h-4 text-blue-400" />
              <span>{getText("corporate_banner_btn_call", defaultCallBtn)}</span>
            </a>
          </div>

        </div>

        {/* Dynamic warning banner style */}
        <div className="mt-8 pt-6 border-t border-zinc-850 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-800/40">
            <ShieldAlert className="w-4 h-4 text-blue-400" />
            <span>{getText("corporate_banner_note", defaultNote)}</span>
          </div>
        </div>
      </div>

      <ContactMethodPicker
        isOpen={isContactPickerOpen}
        onClose={() => setIsContactPickerOpen(false)}
        title={currentLang === "en" ? "Corporate & Workshop Supply Request" : "طلب تسعيرة وتوريدات الشركات"}
        subtitle={currentLang === "en" ? "Select your preferred contact channel to connect with our sales team" : "اختر قناة التواصل المفضلة للتواصل مع قسم المبيعات والتوريدات"}
        customMessage={bannerMessage}
        customSubject={currentLang === "en" ? "Corporate Supply Inquiry" : "استفسار طلب توريدات واستيراد خاص"}
      />
    </section>
  );
}
