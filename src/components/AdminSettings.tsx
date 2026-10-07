import React, { useState } from "react";
import { useSiteContent } from "../context/SiteContentContext";
import { Wrench, Boxes, Award, MessageCircle, Sparkles, Loader2 } from "lucide-react";

export default function AdminSettings() {
  const { getText, updateText } = useSiteContent();

  const isMaintenanceEnabled = getText("maintenance_feature_enabled", "true") !== "false";
  const isFeaturedEnabled = getText("featured_products_section_enabled", "true") !== "false";
  const isBrandsEnabled = getText("brands_section_enabled", "true") !== "false";
  const isProductContactEnabled = getText("product_contact_button_enabled", "true") !== "false";
  const isAiTranslationEnabled = getText("ai_translation_suggestion_enabled", "false") === "true";

  const [togglingMaint, setTogglingMaint] = useState(false);
  const [togglingFeatured, setTogglingFeatured] = useState(false);
  const [togglingBrands, setTogglingBrands] = useState(false);
  const [togglingProductContact, setTogglingProductContact] = useState(false);
  const [togglingAiTranslation, setTogglingAiTranslation] = useState(false);

  const handleToggleMaintenance = async () => {
    setTogglingMaint(true);
    const newValue = isMaintenanceEnabled ? "false" : "true";
    await updateText("maintenance_feature_enabled", newValue);
    setTogglingMaint(false);
  };

  const handleToggleFeatured = async () => {
    setTogglingFeatured(true);
    const newValue = isFeaturedEnabled ? "false" : "true";
    await updateText("featured_products_section_enabled", newValue);
    setTogglingFeatured(false);
  };

  const handleToggleBrands = async () => {
    setTogglingBrands(true);
    const newValue = isBrandsEnabled ? "false" : "true";
    await updateText("brands_section_enabled", newValue);
    setTogglingBrands(false);
  };

  const handleToggleProductContact = async () => {
    setTogglingProductContact(true);
    const newValue = isProductContactEnabled ? "false" : "true";
    await updateText("product_contact_button_enabled", newValue);
    setTogglingProductContact(false);
  };

  const handleToggleAiTranslation = async () => {
    setTogglingAiTranslation(true);
    const newValue = isAiTranslationEnabled ? "false" : "true";
    await updateText("ai_translation_suggestion_enabled", newValue);
    setTogglingAiTranslation(false);
  };

  return (
    <div className="bg-zinc-950 min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-right text-white" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-zinc-850 pb-6">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">إعدادات الأقسام</h1>
          <p className="text-zinc-400 text-xs mt-1">
            التحكم في إظهار أو إخفاء الأقسام الرئيسية في الموقع العام للزوار بشكل فوري
          </p>
        </div>

        {/* Toggles Grid */}
        <div className="grid grid-cols-1 gap-6">
          
          {/* Toggle 1: Maintenance */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-zinc-700 transition-all">
            <div className="flex gap-4 items-start">
              <div className="bg-amber-500/10 text-amber-500 p-3 rounded-xl border border-amber-500/15 shrink-0">
                <Wrench className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-base text-zinc-100">قسم طلبات الصيانة والضمان</h3>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                  تفعيل أو تعطيل قسم الصيانة والضمان بالكامل في الموقع للعملاء والزوار. عند التعطيل، لن يتمكن الزوار من رؤية أو تقديم طلبات صيانة جديدة.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                isMaintenanceEnabled ? "bg-amber-500/10 text-amber-400" : "bg-zinc-800 text-zinc-500"
              }`}>
                {isMaintenanceEnabled ? "مفعّل" : "معطّل"}
              </span>
              <button
                disabled={togglingMaint}
                onClick={handleToggleMaintenance}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isMaintenanceEnabled ? "bg-amber-500" : "bg-zinc-700"
                } ${togglingMaint ? "opacity-60 cursor-not-allowed" : ""}`}
                style={{ direction: "ltr" }}
              >
                {togglingMaint ? (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                  </span>
                ) : (
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isMaintenanceEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                )}
              </button>
            </div>
          </div>

          {/* Toggle 2: Featured Products */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-zinc-700 transition-all">
            <div className="flex gap-4 items-start">
              <div className="bg-sky-500/10 text-sky-400 p-3 rounded-xl border border-sky-500/15 shrink-0">
                <Boxes className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-base text-zinc-100">قسم الأكثر طلبًا وموثوقية</h3>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                  تفعيل أو تعطيل ظهور المنتجات المميزة (الأكثر طلبًا) في الصفحة الرئيسية. إخفاء هذا القسم لا يؤثر على بيانات المنتجات نفسها في الكتالوج.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                isFeaturedEnabled ? "bg-sky-500/10 text-sky-400" : "bg-zinc-800 text-zinc-500"
              }`}>
                {isFeaturedEnabled ? "مفعّل" : "معطّل"}
              </span>
              <button
                disabled={togglingFeatured}
                onClick={handleToggleFeatured}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isFeaturedEnabled ? "bg-sky-500" : "bg-zinc-700"
                } ${togglingFeatured ? "opacity-60 cursor-not-allowed" : ""}`}
                style={{ direction: "ltr" }}
              >
                {togglingFeatured ? (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                  </span>
                ) : (
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isFeaturedEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                )}
              </button>
            </div>
          </div>

          {/* Toggle 3: Brands */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-zinc-700 transition-all">
            <div className="flex gap-4 items-start">
              <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl border border-emerald-500/15 shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-base text-zinc-100">قسم العلامات التجارية وشراكات النجاح</h3>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                  تفعيل أو تعطيل ظهور شريط البراندات المتحرك بالصفحة الرئيسية. إخفاء هذا القسم لا يمس بيانات البراندات في الكتالوج بل يتحكم بمظهره فقط.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                isBrandsEnabled ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500"
              }`}>
                {isBrandsEnabled ? "مفعّل" : "معطّل"}
              </span>
              <button
                disabled={togglingBrands}
                onClick={handleToggleBrands}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isBrandsEnabled ? "bg-emerald-500" : "bg-zinc-700"
                } ${togglingBrands ? "opacity-60 cursor-not-allowed" : ""}`}
                style={{ direction: "ltr" }}
              >
                {togglingBrands ? (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                  </span>
                ) : (
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isBrandsEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                )}
              </button>
            </div>
          </div>

          {/* Toggle 4: Product Contact Button */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-zinc-700 transition-all">
            <div className="flex gap-4 items-start">
              <div className="bg-purple-500/10 text-purple-400 p-3 rounded-xl border border-purple-500/15 shrink-0">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-base text-zinc-100">زرار "تواصل للطلب" في المنتجات</h3>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                  تفعيل أو تعطيل ظهور زرار التواصل والطلب ("تواصل للطلب") في تفاصيل المنتج والبطاقات المصغرة. عند التعطيل يختفي الزرار من بطاقات وصفحات المنتجات فقط.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                isProductContactEnabled ? "bg-purple-500/10 text-purple-400" : "bg-zinc-800 text-zinc-500"
              }`}>
                {isProductContactEnabled ? "مفعّل" : "معطّل"}
              </span>
              <button
                disabled={togglingProductContact}
                onClick={handleToggleProductContact}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isProductContactEnabled ? "bg-purple-500" : "bg-zinc-700"
                } ${togglingProductContact ? "opacity-60 cursor-not-allowed" : ""}`}
                style={{ direction: "ltr" }}
              >
                {togglingProductContact ? (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                  </span>
                ) : (
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isProductContactEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                )}
              </button>
            </div>
          </div>

          {/* Toggle 5: AI Translation Suggestion */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-zinc-700 transition-all">
            <div className="flex gap-4 items-start">
              <div className="bg-amber-500/10 text-amber-400 p-3 rounded-xl border border-amber-500/15 shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-base text-zinc-100">تفعيل اقتراح الترجمة التلقائية (Google Translate API)</h3>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                  عند التعطيل (الوضع الافتراضي): يختفي زرار "اقتراح ترجمة" تماماً من جميع فورمات لوحة التحكم وتتوقف كل طلبات الترجمة الخارجية. عند التفعيل: يظهر الزرار لإتاحة توليد مقترحات ترجمة بالنقر.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                isAiTranslationEnabled ? "bg-amber-500/10 text-amber-400" : "bg-zinc-800 text-zinc-500"
              }`}>
                {isAiTranslationEnabled ? "مفعّل" : "معطّل"}
              </span>
              <button
                disabled={togglingAiTranslation}
                onClick={handleToggleAiTranslation}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isAiTranslationEnabled ? "bg-amber-500" : "bg-zinc-700"
                } ${togglingAiTranslation ? "opacity-60 cursor-not-allowed" : ""}`}
                style={{ direction: "ltr" }}
              >
                {togglingAiTranslation ? (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                  </span>
                ) : (
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isAiTranslationEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                )}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
