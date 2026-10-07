import React, { useState } from "react";
import { useSiteContent, CONTENT_METADATA, DEFAULT_CONTENT_EN } from "../context/SiteContentContext";
import { getSupabase } from "../lib/supabase";
import { 
  ArrowRight, 
  Save, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  Image as ImageIcon, 
  Loader2, 
  Link as LinkIcon,
  Globe
} from "lucide-react";

interface AdminContentProps {
  onBackToDashboard: () => void;
}

export default function AdminContent({ onBackToDashboard }: AdminContentProps) {
  const { content, contentEn, updateText, getText } = useSiteContent();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSection, setActiveSection] = useState<string>("الكل");
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});
  const [editingValuesEn, setEditingValuesEn] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, "idle" | "saving" | "success" | "error">>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  // Group all keys by section
  const sections = ["الكل", "الصفحة الرئيسية", "صفحة الضمان والصيانة", "صفحة من نحن", "بانر توريدات الشركات", "بيانات التواصل والفوتر"];

  // Filter keys
  const keysToRender = Object.keys(CONTENT_METADATA).filter((key) => {
    if (
      key === "maintenance_feature_enabled" ||
      key === "featured_products_section_enabled" ||
      key === "brands_section_enabled" ||
      key === "product_contact_button_enabled"
    ) return false;
    const meta = CONTENT_METADATA[key];
    const matchesSearch = 
      meta.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (content[key] || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contentEn[key] || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeSection === "الكل") return matchesSearch;
    return meta.section === activeSection && matchesSearch;
  });

  const handleFieldChange = (key: string, value: string) => {
    setEditingValues((prev) => ({
      ...prev,
      [key]: value,
    }));
    if (saveStatus[key]) {
      setSaveStatus((prev) => ({ ...prev, [key]: "idle" }));
    }
  };

  const handleFieldChangeEn = (key: string, value: string) => {
    setEditingValuesEn((prev) => ({
      ...prev,
      [key]: value,
    }));
    if (saveStatus[key]) {
      setSaveStatus((prev) => ({ ...prev, [key]: "idle" }));
    }
  };

  const handleSuggestTranslation = (key: string) => {
    // 1. Check default English content
    const defaultEn = DEFAULT_CONTENT_EN[key];
    if (defaultEn) {
      setEditingValuesEn((prev) => ({ ...prev, [key]: defaultEn }));
      if (saveStatus[key]) {
        setSaveStatus((prev) => ({ ...prev, [key]: "idle" }));
      }
      return;
    }

    // 2. Fallback to current Arabic
    const currentAr = editingValues[key] !== undefined ? editingValues[key] : (content[key] || "");
    setEditingValuesEn((prev) => ({ ...prev, [key]: currentAr }));
    if (saveStatus[key]) {
      setSaveStatus((prev) => ({ ...prev, [key]: "idle" }));
    }
  };

  const handleSaveField = async (key: string) => {
    const valueToSave = editingValues[key] !== undefined ? editingValues[key] : (content[key] || "");
    const valueEnToSave = editingValuesEn[key] !== undefined ? editingValuesEn[key] : (contentEn[key] || DEFAULT_CONTENT_EN[key] || "");
    
    setSaveStatus((prev) => ({ ...prev, [key]: "saving" }));

    try {
      const success = await updateText(key, valueToSave, valueEnToSave);
      if (success) {
        setSaveStatus((prev) => ({ ...prev, [key]: "success" }));
        setTimeout(() => {
          setSaveStatus((prev) => ({ ...prev, [key]: "idle" }));
        }, 3000);
      } else {
        setSaveStatus((prev) => ({ ...prev, [key]: "error" }));
      }
    } catch (err) {
      console.error(err);
      setSaveStatus((prev) => ({ ...prev, [key]: "error" }));
    }
  };

  const handleImageUpload = async (key: string, file: File) => {
    setUploadingKey(key);
    setSaveStatus((prev) => ({ ...prev, [key]: "saving" }));

    const supabase = getSupabase();
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `site-${key}-${Math.random().toString(36).substring(2, 11)}.${fileExt}`;
      const filePath = `site-content/${fileName}`;

      let publicUrl = "";

      if (supabase) {
        let { data, error } = await supabase.storage
          .from("products")
          .upload(filePath, file, { cacheControl: "3600", upsert: true });

        if (error) {
          const secondary = await supabase.storage
            .from("images")
            .upload(filePath, file, { cacheControl: "3600", upsert: true });

          if (secondary.error) {
            throw new Error(`Storage upload error: ${secondary.error.message}`);
          }
          data = secondary.data;
        }

        const bucketName = error ? "images" : "products";
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        publicUrl = urlData.publicUrl;
      } else {
        throw new Error("Supabase is not configured.");
      }

      const success = await updateText(key, publicUrl);
      if (success) {
        setEditingValues((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        setSaveStatus((prev) => ({ ...prev, [key]: "success" }));
        setTimeout(() => {
          setSaveStatus((prev) => ({ ...prev, [key]: "idle" }));
        }, 3000);
      } else {
        setSaveStatus((prev) => ({ ...prev, [key]: "error" }));
      }

    } catch (err) {
      console.warn("Storage upload failed, trying Base64 fallback:", err);
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          if (typeof reader.result === "string") {
            const base64Url = reader.result;
            const success = await updateText(key, base64Url);
            if (success) {
              setEditingValues((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
              });
              setSaveStatus((prev) => ({ ...prev, [key]: "success" }));
              setTimeout(() => {
                setSaveStatus((prev) => ({ ...prev, [key]: "idle" }));
              }, 3000);
            } else {
              setSaveStatus((prev) => ({ ...prev, [key]: "error" }));
            }
          }
        };
        reader.readAsDataURL(file);
      } catch (fallbackErr) {
        console.error("Base64 fallback failed:", fallbackErr);
        setSaveStatus((prev) => ({ ...prev, [key]: "error" }));
      }
    } finally {
      setUploadingKey(null);
    }
  };

  return (
    <div className="bg-zinc-950 min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-right text-white" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Title and Nav Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              <span>إدارة نصوص ومحتوى الصفحات الثابتة (CMS)</span>
            </h1>
            <p className="text-zinc-400 text-xs">
              عدّل نصوص ومحتوى الصفحة الرئيسية، الضمان، من نحن باللغتين العربية والإنجليزي دون الحاجة لتغيير الكود.
            </p>
          </div>

          <button
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>لوحة التحكم الرئيسية</span>
          </button>
        </div>

        {/* Database Migration SQL Notice Banner */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs space-y-2 text-amber-200">
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <Globe className="w-4 h-4" />
            <span>تحديث قاعدة البيانات (تفعيل حفظ الترجمة الإنجليزية للمحتوى الثابت):</span>
          </div>
          <p className="text-zinc-300 text-[11px] leading-relaxed">
            إذا لم تقم بتنفيذ الاستعلام مسبقاً في SQL Editor في Supabase، يرجى تشغيل الأمر التالي لحفظ الترجمات الإنجليزية بجدول محتوى الموقع:
          </p>
          <code className="block bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl font-mono text-[11px] text-amber-300 dir-ltr text-left select-all">
            alter table public.site_content add column if not exists value_en text;
          </code>
        </div>

        {/* Search and Section Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          {/* Search Bar */}
          <div className="md:col-span-4 relative">
            <Search className="absolute right-3.5 top-3 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="ابحث عن نص بالعربي أو الإنجليزي..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-all text-right"
            />
          </div>

          {/* Section Tab Filters */}
          <div className="md:col-span-8 flex flex-wrap gap-2 justify-start md:justify-end">
            {sections.map((section) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  activeSection === section
                    ? "bg-amber-500 text-zinc-950 border-amber-400 font-extrabold shadow-md shadow-amber-500/10"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-850"
                }`}
              >
                {section}
              </button>
            ))}
          </div>
        </div>

        {/* Content Keys Editor List */}
        <div className="space-y-6">
          {keysToRender.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800/85 rounded-2xl p-12 text-center text-zinc-500">
              لا توجد عناصر تطابق بحثك حالياً.
            </div>
          ) : (
            keysToRender.map((key) => {
              const meta = CONTENT_METADATA[key];
              const currentValueAr = content[key] || "";
              const currentValueEn = contentEn[key] || DEFAULT_CONTENT_EN[key] || "";

              const editedValueAr = editingValues[key] !== undefined ? editingValues[key] : currentValueAr;
              const editedValueEn = editingValuesEn[key] !== undefined ? editingValuesEn[key] : currentValueEn;

              const status = saveStatus[key] || "idle";
              const isChanged = editedValueAr !== currentValueAr || editedValueEn !== currentValueEn;
              const isImage = meta.type === "image";
              const isBoolean = meta.type === "boolean";

              return (
                <div 
                  key={key} 
                  className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 hover:border-zinc-750 transition-all space-y-4"
                >
                  {/* Card Header metadata */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/60">
                    <div className="space-y-1">
                      <span className="inline-block bg-zinc-800 text-zinc-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {meta.section}
                      </span>
                      <h3 className="text-sm font-bold text-white pr-1 flex items-center gap-1.5">
                        {isImage && <ImageIcon className="w-4 h-4 text-amber-500" />}
                        <span>{meta.label}</span>
                      </h3>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-500 bg-zinc-950 px-2 py-1 rounded border border-zinc-850">
                      {key}
                    </span>
                  </div>

                  {/* Image Type Inputs & Previews */}
                  {isImage ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                      {/* Current Image Preview */}
                      <div className="lg:col-span-4 flex flex-col justify-center items-center bg-zinc-950 p-4 rounded-xl border border-zinc-800 min-h-[160px] relative overflow-hidden group">
                        {editedValueAr ? (
                          <>
                            <img
                              src={editedValueAr}
                              alt={meta.label}
                              className="max-h-36 w-auto object-contain rounded-lg shadow-md max-w-full"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as any).src = "https://placehold.co/400x300?text=صورة+غير+صالحة";
                              }}
                            />
                            <div className="absolute inset-0 bg-zinc-950/85 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3 text-center text-[10px] text-zinc-300 leading-relaxed break-all">
                              {editedValueAr}
                            </div>
                          </>
                        ) : (
                          <div className="text-zinc-600 text-center space-y-2">
                            <ImageIcon className="w-10 h-10 mx-auto opacity-40" />
                            <span className="text-[11px] block">لا توجد صورة حالياً</span>
                          </div>
                        )}
                      </div>

                      {/* URL input and File Uploader Area */}
                      <div className="lg:col-span-8 space-y-4">
                        {/* URL Manual Input */}
                        <div className="space-y-1">
                          <label className="text-[11px] text-zinc-400 font-bold block flex items-center gap-1">
                            <LinkIcon className="w-3 h-3 text-amber-500" />
                            <span>رابط الصورة المباشر</span>
                          </label>
                          <input
                            type="text"
                            value={editedValueAr}
                            onChange={(e) => handleFieldChange(key, e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 transition-all text-left font-mono"
                          />
                        </div>

                        {/* File selector Box */}
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            id={`file-upload-${key}`}
                            className="hidden"
                            disabled={uploadingKey === key}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleImageUpload(key, e.target.files[0]);
                              }
                            }}
                          />
                          <label
                            htmlFor={`file-upload-${key}`}
                            className={`flex flex-col sm:flex-row items-center justify-center gap-3 border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all ${
                              uploadingKey === key
                                ? "border-amber-500 bg-amber-500/5 cursor-not-allowed"
                                : "border-zinc-800 hover:border-zinc-700 bg-zinc-950 hover:bg-zinc-900"
                            }`}
                          >
                            {uploadingKey === key ? (
                              <>
                                <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                                <span className="text-xs font-bold text-amber-500">جاري رفع الصورة وتحديث الموقع فوراً...</span>
                              </>
                            ) : (
                              <>
                                <div className="bg-zinc-900 p-2 rounded-lg text-zinc-400">
                                  <Upload className="w-4 h-4" />
                                </div>
                                <div className="text-center sm:text-right space-y-0.5">
                                  <span className="block text-xs font-bold text-zinc-300">اختر صورة جديدة من جهازك لرفعها مباشرة</span>
                                  <span className="block text-[10px] text-zinc-500 font-medium">سيتم رفع الصورة تلقائياً لـ Supabase Storage وتفعيلها</span>
                                </div>
                              </>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>
                  ) : isBoolean ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleFieldChange(key, "true")}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            editedValueAr === "true"
                              ? "bg-amber-500 text-zinc-950 border-amber-400 font-extrabold shadow-md shadow-amber-500/10"
                              : "bg-zinc-950 text-zinc-400 border-zinc-850 hover:bg-zinc-900"
                          }`}
                        >
                          تفعيل الميزة (ظاهرة)
                        </button>
                        <button
                          onClick={() => handleFieldChange(key, "false")}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            editedValueAr === "false"
                              ? "bg-red-500 text-white border-red-400 font-extrabold shadow-md shadow-red-500/10"
                              : "bg-zinc-950 text-zinc-400 border-zinc-850 hover:bg-zinc-900"
                          }`}
                        >
                          تعطيل الميزة (مخفية)
                        </button>
                      </div>
                      <span className="text-xs text-zinc-400">
                        الوضع الحالي في التعديل: <strong className={editedValueAr === "true" ? "text-amber-500" : "text-red-500"}>{editedValueAr === "true" ? "مفعّل (ظاهر للزوار)" : "معطّل (مخفي بالكامل)"}</strong>
                      </span>
                    </div>
                  ) : (
                    /* Standard Text Type Input with English Parallel Field & Suggest Translation */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Arabic Field */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-zinc-400 font-bold block">
                          النص بالعربي (Arabic)
                        </label>
                        <textarea
                          rows={Math.max(2, Math.min(6, editedValueAr.split("\n").length))}
                          value={editedValueAr}
                          onChange={(e) => handleFieldChange(key, e.target.value)}
                          placeholder="أدخل النص بالعربي هنا..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 leading-relaxed placeholder-zinc-650 focus:outline-none focus:border-amber-500 transition-all text-right resize-y font-sans"
                        />
                      </div>

                      {/* English Field */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] text-amber-400/90 font-bold block flex items-center gap-1">
                            <Globe className="w-3 h-3 text-amber-400" />
                            <span>الاسم / النص بالإنجليزي (English)</span>
                          </label>
                          {getText("ai_translation_suggestion_enabled", "false") === "true" && (
                            <button
                              type="button"
                              onClick={() => handleSuggestTranslation(key)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-lg transition-all cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              <span>اقتراح ترجمة</span>
                            </button>
                          )}
                        </div>
                        <textarea
                          rows={Math.max(2, Math.min(6, editedValueEn.split("\n").length))}
                          value={editedValueEn}
                          onChange={(e) => handleFieldChangeEn(key, e.target.value)}
                          placeholder="Enter text in English..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 leading-relaxed placeholder-zinc-650 focus:outline-none focus:border-amber-500 transition-all text-left resize-y font-sans dir-ltr"
                        />
                      </div>
                    </div>
                  )}

                  {/* Card Footer action and status indicator */}
                  <div className="flex items-center justify-between gap-4 pt-1">
                    {/* Status feedback */}
                    <div className="flex items-center gap-1.5 text-xs">
                      {status === "saving" && (
                        <span className="text-zinc-400 flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
                          جاري الحفظ في قاعدة البيانات...
                        </span>
                      )}
                      {status === "success" && (
                        <span className="text-emerald-400 font-bold flex items-center gap-1 animate-fade-in">
                          <CheckCircle2 className="w-4 h-4" />
                          تم الحفظ وتفعيل التعديل بنجاح!
                        </span>
                      )}
                      {status === "error" && (
                        <span className="text-red-400 font-bold flex items-center gap-1 animate-fade-in">
                          <AlertCircle className="w-4 h-4" />
                          فشل الحفظ. تأكد من إعداد جدول site_content.
                        </span>
                      )}
                      {status === "idle" && isChanged && (
                        <span className="text-amber-500 text-[11px] font-medium animate-pulse">
                          تغييرات غير محفوظة (اضغط حفظ التعديل للتأكيد)
                        </span>
                      )}
                    </div>

                    {/* Action button */}
                    <button
                      onClick={() => handleSaveField(key)}
                      disabled={status === "saving" || !isChanged}
                      className={`inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        isChanged
                          ? "bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black shadow-md shadow-amber-500/10"
                          : "bg-zinc-850 text-zinc-500 cursor-not-allowed"
                      }`}
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{status === "saving" ? "جاري الحفظ..." : "حفظ التعديل"}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
