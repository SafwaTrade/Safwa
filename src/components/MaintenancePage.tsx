import React, { useState, FormEvent } from "react";
import { companyInfo } from "../data/placeholder";
import { getSupabase } from "../lib/supabase";
import { useSiteContent } from "../context/SiteContentContext";
import { useTranslation } from "react-i18next";
import ContactMethodPicker from "./ContactMethodPicker";
import { 
  ShieldCheck, 
  Wrench, 
  FileText, 
  CheckCircle2, 
  MessageCircle, 
  ChevronRight, 
  Clock, 
  AlertTriangle,
  Send,
  HelpCircle,
  Upload,
  X
} from "lucide-react";

interface MaintenancePageProps {
  onNavigateToHome: () => void;
}

export default function MaintenancePage({ onNavigateToHome }: MaintenancePageProps) {
  const { getText } = useSiteContent();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || "ar";

  const [isContactPickerOpen, setIsContactPickerOpen] = useState(false);
  const quickMessage = currentLang === "en" 
    ? "Hello, I would like to request maintenance and technical support for a tool/product."
    : "مرحبًا الصفوة، أود طلب صيانة ومساعدة فنية بخصوص منتج صناعي.";

  // Form fields state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [productName, setProductName] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [middleName, setMiddleName] = useState(""); // Honeypot state

  // Files state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form submit handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !productName || !issueDescription) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    // 1. Honeypot check
    if (middleName) {
      // Silent success (pretend submit succeeded to deceive spam bots)
      setName("");
      setPhone("");
      setProductName("");
      setIssueDescription("");
      setPurchaseDate("");
      setMiddleName("");
      setSelectedFiles([]);
      setFilePreviews([]);
      setIsSuccess(true);
      setIsSubmitting(false);
      return;
    }

    // 2. Rate Limiting Check (1 minute interval)
    const lastSubmit = localStorage.getItem("last_maintenance_submit_time");
    if (lastSubmit) {
      const timePassed = Date.now() - parseInt(lastSubmit, 10);
      if (timePassed < 60000) {
        setErrorMsg(currentLang === "en" ? "Please wait at least one minute before submitting a new request." : "من فضلك انتظر دقيقة على الأقل قبل إرسال طلب جديد.");
        setIsSubmitting(false);
        return;
      }
    }

    // 3. Name validation
    if (name.trim().length < 3) {
      setErrorMsg(currentLang === "en" ? "Please enter a valid real name (more than 2 characters)." : "يرجى إدخال اسم حقيقي صالح (أكثر من حرفين).");
      setIsSubmitting(false);
      return;
    }
    const nameLetterCheck = /[\u0600-\u06FFa-zA-Z]/g;
    const lettersCount = (name.match(nameLetterCheck) || []).length;
    if (lettersCount < 3) {
      setErrorMsg(currentLang === "en" ? "Please enter a real name with valid letters." : "يرجى إدخال اسم حقيقي يحتوي على حروف صالحة.");
      setIsSubmitting(false);
      return;
    }

    // 4. Phone validation (Egyptian phone format starting with 01 and having 11 digits, or matching standard +20 prefix)
    const cleanPhone = phone.trim().replace(/[\s-()]/g, "");
    const egPhoneRegex = /^(01[0125]\d{8})$|^(\+?201[0125]\d{8})$|^00201[0125]\d{8}$/;
    if (!egPhoneRegex.test(cleanPhone)) {
      setErrorMsg(currentLang === "en" ? "Please enter a valid phone number (11 digits)." : "يرجى إدخال رقم هاتف مصري صحيح (يبدأ بـ 01 ويتكون من 11 رقمًا).");
      setIsSubmitting(false);
      return;
    }

    const supabase = getSupabase();
    const uploadedUrls: string[] = [];

    // Process file uploads
    for (const file of selectedFiles) {
      let urlSaved = "";
      if (supabase) {
        try {
          const fileExt = file.name.split(".").pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}.${fileExt}`;
          const filePath = `maintenance/${fileName}`;

          // Upload directly to "maintenance-images" bucket
          let { error: uploadError } = await supabase.storage
            .from("maintenance-images")
            .upload(filePath, file, { cacheControl: "3600", upsert: false });

          if (uploadError) {
            console.error("Storage upload error on maintenance-images detail:", uploadError.message, uploadError.name);
            throw uploadError;
          }

          // Get public URL from the successful upload
          const { data: urlData } = supabase.storage
            .from("maintenance-images")
            .getPublicUrl(filePath);

          urlSaved = urlData.publicUrl;
        } catch (err: any) {
          console.error("Storage upload exception message:", err.message || err);
          setErrorMsg(currentLang === "en" ? `Image upload failed: ${err.message || "Check permissions or file size"}` : `فشل رفع الصور المرفقة: ${err.message || "يرجى التحقق من الصلاحيات أو حجم الملف"}`);
          setIsSubmitting(false);
          return;
        }
      } else {
        setErrorMsg(currentLang === "en" ? "Sorry, database connection is currently unavailable." : "عذرًا، خدمة الاتصال بقاعدة البيانات غير متوفرة حاليًا لرفع الصور.");
        setIsSubmitting(false);
        return;
      }

      if (urlSaved) {
        uploadedUrls.push(urlSaved);
      }
    }

    const payload: any = {
      name,
      phone,
      product_name: productName,
      issue_description: issueDescription,
      purchase_date: purchaseDate ? purchaseDate : null,
      image_urls: uploadedUrls,
      status: "جديد",
      is_seen: false
    };

    if (supabase) {
      try {
        let { error } = await supabase
          .from("maintenance_requests")
          .insert([payload]);

        if (error) {
          if (error.code === "PGRST204" || (error.message && error.message.includes("is_seen"))) {
            const fallbackPayload = { ...payload };
            delete fallbackPayload.is_seen;
            const retryResult = await supabase
              .from("maintenance_requests")
              .insert([fallbackPayload]);
            error = retryResult.error;
          }
        }

        if (error) {
          console.error("Supabase maintenance insert error message:", error.message, "code:", error.code, "details:", error.details);
          throw error;
        }
      } catch (err: any) {
        console.error("Database error saving maintenance request message:", err.message || err, "details:", err.details || err);
        setErrorMsg(currentLang === "en" ? `Failed to save request: ${err.message}` : `عذرًا، فشل إرسال طلب الصيانة: ${err.message || "حدث خطأ أثناء حفظ البيانات"}`);
        setIsSubmitting(false);
        return;
      }
    } else {
      setErrorMsg(currentLang === "en" ? "Failed to save request due to inactive database connection." : "عذرًا، تعذر حفظ طلب الصيانة لعدم وجود اتصال نشط مع قاعدة البيانات.");
      setIsSubmitting(false);
      return;
    }

    setIsSuccess(true);
    setIsSubmitting(false);
    
    // Clear form fields & files
    setName("");
    setPhone("");
    setProductName("");
    setIssueDescription("");
    setPurchaseDate("");
    setMiddleName("");
    setSelectedFiles([]);
    setFilePreviews([]);

    // Save last submission timestamp to enforce rate limiting
    localStorage.setItem("last_maintenance_submit_time", Date.now().toString());
  };

  return (
    <div className="bg-zinc-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-start">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-8 font-medium">
          <button 
            onClick={onNavigateToHome}
            className="hover:text-amber-600 transition-colors cursor-pointer"
          >
            {currentLang === "en" ? "Home" : "الرئيسية"}
          </button>
          <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          <span className="text-zinc-900 font-bold">
            {currentLang === "en" ? "Certified Warranty & Maintenance" : "الضمان والصيانة المعتمدة"}
          </span>
        </nav>

        {/* Header Hero Banner */}
        <div className="bg-zinc-900 text-white rounded-3xl p-8 sm:p-12 mb-12 relative overflow-hidden border border-zinc-800 shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -ml-20 -mb-20"></div>

          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="inline-block bg-amber-500/20 text-amber-400 text-xs font-black px-3.5 py-1.5 rounded-full border border-amber-500/20">
              {getText("warranty_hero_badge", currentLang === "en" ? "After-Sales Service & Certified Support" : "خدمة ما بعد البيع والدعم المعتمد")}
            </span>
            <h1 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight">
              {getText("warranty_hero_title", currentLang === "en" ? "Genuine Maintenance with Certified Spare Parts & Real Warranty" : "صيانة أصلية بقطع غيار معتمدة وضمان حقيقي")}
            </h1>
            <p className="text-zinc-400 text-xs sm:text-base leading-relaxed whitespace-pre-line">
              {getText("warranty_hero_description", currentLang === "en"
                ? `At ${companyInfo.englishName || companyInfo.name}, we are committed to delivering top-tier technical support for your electrical and power tools to ensure optimal operational efficiency and long life. We use 100% genuine parts supervised by qualified engineers.`
                : `في شركة ${companyInfo.name}، نلتزم بتقديم أعلى مستويات الدعم الفني لأجهزتك المنزلية والكهربائية لضمان كفاءة تشغيلها وعمرها الافتراضي الطويل. نعتمد فقط على قطع غيار أصلية بنسبة 100% من المصانع وبإشراف مهندسين متخصصين وفنيين محترفين.`)}
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Warranty Info & Maintenance terms (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Warranty Info Section */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-zinc-150">
                <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-extrabold text-zinc-900 text-lg">
                    {currentLang === "en" ? "Certified Warranty Details & Policy" : "تفاصيل وسياسة الضمان المعتمد"}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {currentLang === "en" ? "Terms and warranty period for purchased equipment" : "شروط وفترة الضمان الحقيقي للأجهزة المشتراة"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-150 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#3e499e] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="block font-bold text-xs text-zinc-500">
                      {currentLang === "en" ? "Warranty Period" : "فترة الضمان"}
                    </span>
                    <p className="text-sm text-zinc-900 font-extrabold">
                      {getText("warranty_duration_text", currentLang === "en" ? "12 Full Months" : "12 شهراً كاملة")}
                    </p>
                    <span className="block text-[10px] text-zinc-450 leading-relaxed">
                      {getText("warranty_duration_desc", currentLang === "en" ? "Warranty is valid from the date of purchase on the official invoice or warranty card." : "يسري الضمان من تاريخ الشراء المدون في الفاتورة الرسمية أو بطاقة الضمان.")}
                    </span>
                  </div>
                </div>

                <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-150 flex items-start gap-3">
                  <Wrench className="w-5 h-5 text-[#3e499e] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="block font-bold text-xs text-zinc-500">
                      {currentLang === "en" ? "Maintenance Standard" : "مستوى الصيانة"}
                    </span>
                    <p className="text-sm text-zinc-900 font-extrabold">
                      {getText("warranty_level_text", currentLang === "en" ? "100% Genuine Spare Parts" : "قطع غيار أصلية 100%")}
                    </p>
                    <span className="block text-[10px] text-zinc-450 leading-relaxed">
                      {getText("warranty_level_desc", currentLang === "en" ? "Free replacement for defective parts during warranty period against manufacturing defects." : "استبدال مجاني للأجزاء التالفة طوال فترة الضمان ضد عيوب الصناعة مع تقديم فاتورة الصيانة المعتمدة.")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-zinc-900 text-sm mb-2.5 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#3e499e]"></span>
                    <span>{currentLang === "en" ? "What Official Warranty Covers:" : "ما يغطيه الضمان الرسمي:"}</span>
                  </h3>
                  <ul className="text-xs text-zinc-600 space-y-2 list-disc list-inside ps-2 leading-relaxed">
                    {getText("warranty_covered_terms", currentLang === "en" 
                      ? "Technical faults and manufacturing defects resulting from normal operating conditions.\nRaw material defects and manufacturing quality directly from the factory.\nInternal assembly errors of mechanical and electrical components."
                      : "الأعطال الفنية والعيوب المصنعية الناتجة عن التشغيل والظروف العادية للمنتجات.\nعيوب المواد الخام وجودة التصنيع من المصنع مباشرة.\nأخطاء التجميع الداخلي للأجزاء الميكانيكية والكهربائية.")
                      .split("\n")
                      .filter(Boolean)
                      .map((line, idx) => (
                        <li key={idx}>{line}</li>
                      ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-red-650 text-sm mb-2.5 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                    <span>{currentLang === "en" ? "What Warranty Does Not Cover (Voiding Cases):" : "ما لا يغطيه الضمان (حالات سقوط الضمان):"}</span>
                  </h3>
                  <ul className="text-xs text-zinc-600 space-y-2 list-disc list-inside ps-2 leading-relaxed">
                    {getText("warranty_not_covered_terms", currentLang === "en"
                      ? "Faults resulting from misuse, overload, dropping or impacting the product.\nDamage caused by exposing equipment to water, moisture, or liquids (unless specifically rated).\nOperating on electrical current non-compliant with recommended specifications.\nImportant Notice: Attempting to open, modify, or repair the device outside our authorized maintenance center voids the warranty immediately."
                      : "الأعطال الناتجة عن سوء الاستخدام، التحميل الزائد، أو سقوط المنتج وصدمه.\nالأضرار الناجمة عن تعرض الأجهزة للمياه والرطوبة والسوائل (ما لم تكن مصممة لذلك).\nالتشغيل على تيار كهربائي غير مطابق للمواصفات الفنية الموصى بها في الكتيب.\nتنبيه هام: محاولة فتح الجهاز، تعديله، أو عمل صيانة له خارج مركز الصيانة المعتمد لشركة الصفوة يسقط الضمان فوراً.")
                      .split("\n")
                      .filter(Boolean)
                      .map((line, idx) => {
                        if (line.includes("تنبيه هام:") || line.includes("Important Notice:")) {
                          const prefix = line.includes("Important Notice:") ? "Important Notice:" : "تنبيه هام:";
                          const parts = line.split(prefix);
                          return (
                            <li key={idx}>
                              <span className="text-red-650 font-bold">{prefix}</span>
                              {parts[1] || parts[0]}
                            </li>
                          );
                        }
                        return <li key={idx}>{line}</li>;
                      })}
                  </ul>
                </div>

                <div className="bg-[#3e499e]/5 rounded-2xl p-4 border border-[#3e499e]/10 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#3e499e] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="block font-bold text-xs text-[#3e499e]">
                      {currentLang === "en" ? "Important Notice" : "ملاحظة هامة"}
                    </span>
                    <p className="text-[11px] text-zinc-600 leading-relaxed">
                      {getText("warranty_note", currentLang === "en" 
                        ? "Please retain the original purchase invoice and warranty card to present when requesting maintenance service."
                        : "الرجاء الاحتفاظ بفاتورة الشراء الأصلية وبطاقة الضمان المختومة من الوكيل لتقديمها عند طلب الصيانة لضمان إثبات تاريخ الشراء وحالة التفعيل.")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Maintenance policy info */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-zinc-150">
                <div className="bg-[#3e499e]/10 p-2.5 rounded-xl text-[#3e499e]">
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-extrabold text-zinc-900 text-lg">
                    {getText("maintenance_terms_title", currentLang === "en" ? "Benefits & Terms of Regular & External Maintenance" : "مزايا وشروط الصيانة الدورية والخارجية")}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {getText("maintenance_terms_desc", currentLang === "en" ? "Professional extended service even after warranty expiration" : "خدمة احترافية ممتدة حتى بعد انتهاء فترة الضمان")}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-zinc-100 text-zinc-800 font-extrabold text-xs h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-mono">
                    1
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-zinc-900">
                      {getText("maintenance_term_1_title", currentLang === "en" ? "Accurate Problem Diagnosis" : "فحص وتحديد دقيق للمشكلات")}
                    </h4>
                    <p className="text-xs text-zinc-500 leading-relaxed whitespace-pre-line">
                      {getText("maintenance_term_1_desc", currentLang === "en"
                        ? "Tools and equipment are inspected using advanced diagnostic gear to pinpoint the precise fault and avoid unnecessary part replacements."
                        : "يتم فحص الأجهزة باستخدام أجهزة قياس تشخيصية متطورة لتحديد سبب العطل الفعلي بدقة وتجنب التغيير العشوائي للقطع.")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-zinc-100 text-zinc-800 font-extrabold text-xs h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-mono">
                    2
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-zinc-900">
                      {getText("maintenance_term_2_title", currentLang === "en" ? "Genuine Spare Parts at Factory Rates" : "توفير قطع الغيار بأسعار مخفضة")}
                    </h4>
                    <p className="text-xs text-zinc-500 leading-relaxed whitespace-pre-line">
                      {getText("maintenance_term_2_desc", currentLang === "en"
                        ? "We provide all original spare parts and accessories (motors, gears, switches, belts) at genuine factory rates with warranty on replaced parts."
                        : "نوفر كافة قطع الغيار ومستلزمات التشغيل كالمحركات، التروس، الأزرار والسيور بأسعار المصنع الأصلية المخفضة مع تقديم ضمان على قطع الغيار المستبدلة.")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-zinc-100 text-zinc-800 font-extrabold text-xs h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-mono">
                    3
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-zinc-900">
                      {getText("maintenance_term_3_title", currentLang === "en" ? "Complete Transparency & Clear Estimates" : "شفافية كاملة وتكاليف واضحة")}
                    </h4>
                    <p className="text-xs text-zinc-500 leading-relaxed whitespace-pre-line">
                      {getText("maintenance_term_3_desc", currentLang === "en"
                        ? "After warranty expiration, we provide a free initial technical inspection and total cost estimate before beginning work so you stay fully informed."
                        : "بعد انتهاء فترة الضمان، نقوم بتقديم فحص فني مبدئي مجاني وتقدير إجمالي لتكلفة الصيانة والمصنعية قبل البدء في التنفيذ ليكون العميل على دراية كاملة بجميع التفاصيل.")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Maintenance Request Form & Support Callout (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Quick WhatsApp Support Callout */}
            <div className="bg-[#3e499e] rounded-3xl p-6 text-white shadow-lg space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="bg-white/10 p-2.5 rounded-xl text-white">
                  <MessageCircle className="w-6 h-6 fill-white text-[#3e499e]" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-base">
                    {currentLang === "en" ? "Instant WhatsApp Maintenance Support" : "دعم صيانة فوري عبر واتساب"}
                  </h3>
                  <p className="text-blue-100/90 text-xs leading-relaxed">
                    {currentLang === "en"
                      ? "Prefer talking directly to a maintenance engineer? Send a photo or video of the issue via WhatsApp for quick diagnosis and immediate follow-up."
                      : "هل تفضل التحدث مباشرة مع مهندس الصيانة؟ يمكنك إرسال صورة العطل أو فيديو للمشكلة عبر واتساب للتشخيص السريع والمتابعة الفورية."}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setIsContactPickerOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-zinc-100 text-[#3e499e] font-black py-3 rounded-2xl text-xs transition-all shadow-sm cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-[#3e499e] text-white" />
                <span>{currentLang === "en" ? "Contact Support Directly" : "تواصل معنا للصيانة السريعة"}</span>
              </button>
            </div>

            {/* Maintenance Form Box */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="space-y-1 pb-4 border-b border-zinc-150">
                <h3 className="font-extrabold text-zinc-900 text-lg">
                  {currentLang === "en" ? "Certified Maintenance Request" : "طلب صيانة معتمد"}
                </h3>
                <p className="text-xs text-zinc-400">
                  {currentLang === "en" ? "Please fill out the form accurately and our technician will contact you" : "يرجى ملء النموذج بدقة وسيقوم فني الصيانة بالتواصل معك"}
                </p>
              </div>

              {isSuccess ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center space-y-4">
                  <div className="bg-emerald-500 text-white p-3 rounded-full inline-flex">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-zinc-900 text-base">
                      {currentLang === "en" ? "Maintenance Request Submitted Successfully" : "تم إرسال طلب الصيانة بنجاح"}
                    </h4>
                    <p className="text-zinc-650 text-xs leading-relaxed">
                      {currentLang === "en" 
                        ? "Thank you. Your request has been logged. Our technical engineer will call you on the registered phone number within 24 working hours."
                        : "شكرًا لك. لقد تم تسجيل طلب الصيانة الخاص بك في النظام بنجاح. سيقوم مهندس الدعم الفني بالاتصال بك على رقم الهاتف المسجل خلال ٢٤ ساعة عمل لتأكيد موعد استلام أو إرسال المنتج."}
                    </p>
                  </div>
                  
                  {errorMsg && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 text-[11px] p-3 rounded-xl text-start leading-relaxed">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    onClick={() => setIsSuccess(false)}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    {currentLang === "en" ? "Submit Another Request" : "تقديم طلب صيانة آخر"}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Honeypot field */}
                  <div className="absolute opacity-0 -z-10 w-0 h-0 overflow-hidden" tabIndex={-1}>
                    <label htmlFor="middle_name">اسم العائلة الأوسط</label>
                    <input
                      id="middle_name"
                      type="text"
                      name="middle_name"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      autoComplete="off"
                    />
                  </div>

                  {/* Name field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-700">
                      {currentLang === "en" ? "Full Name *" : "اسم العميل بالكامل *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={currentLang === "en" ? "e.g. Ahmed Mohamed" : "مثال: أحمد محمد علي"}
                      className="w-full bg-zinc-50 border border-zinc-200/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3e499e] focus:bg-white transition-colors"
                    />
                  </div>

                  {/* Phone field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-700">
                      {currentLang === "en" ? "Phone Number *" : "رقم الهاتف للتواصل *"}
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={currentLang === "en" ? "e.g. 01xxxxxxxxx" : "مثال: 01xxxxxxxxx"}
                      className="w-full bg-zinc-50 border border-zinc-200/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3e499e] focus:bg-white transition-colors text-start font-mono"
                    />
                  </div>

                  {/* Product name field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-700">
                      {currentLang === "en" ? "Product / Device Name *" : "اسم/نوع المنتج أو الجهاز *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder={currentLang === "en" ? "e.g. Bosch Hammer Drill 800W" : "مثال: شنيور دقاق بوش 800 وات"}
                      className="w-full bg-zinc-50 border border-zinc-200/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3e499e] focus:bg-white transition-colors"
                    />
                  </div>

                  {/* Purchase Date field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-700 flex items-center justify-between">
                      <span>{currentLang === "en" ? "Approximate Purchase Date" : "تاريخ شراء المنتج تقريبًا"}</span>
                      <span className="text-zinc-400 font-normal text-[10px]">
                        {currentLang === "en" ? "(Optional)" : "(اختياري)"}
                      </span>
                    </label>
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3e499e] focus:bg-white transition-colors"
                    />
                  </div>

                  {/* Issue description field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-700">
                      {currentLang === "en" ? "Detailed Issue Description *" : "وصف المشكلة بالتفصيل *"}
                    </label>
                    <textarea
                      required
                      value={issueDescription}
                      onChange={(e) => setIssueDescription(e.target.value)}
                      placeholder={currentLang === "en" ? "e.g. The device sparks inside or rotation is very weak..." : "مثال: الجهاز يصدر شرر من الداخل أو الدوران ضعيف جدًا..."}
                      rows={4}
                      className="w-full bg-zinc-50 border border-zinc-200/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3e499e] focus:bg-white transition-colors resize-none"
                    />
                  </div>

                  {/* Image upload field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-700 flex items-center justify-between">
                      <span>{currentLang === "en" ? "Attach Images of the Issue" : "إرفاق صور للمشكلة أو المنتج"}</span>
                      <span className="text-zinc-400 font-normal text-[10px]">
                        {currentLang === "en" ? "(Optional - Max 3 images)" : "(اختياري - حد أقصى 3 صور)"}
                      </span>
                    </label>
                    
                    {/* Drag and Drop Area */}
                    <div 
                      className="border-2 border-dashed border-zinc-200 hover:border-[#3e499e] rounded-2xl p-4 transition-colors cursor-pointer bg-zinc-50/50 flex flex-col items-center justify-center text-center space-y-2"
                      onClick={() => document.getElementById("maintenance-image-upload")?.click()}
                    >
                      <Upload className="w-6 h-6 text-zinc-400" />
                      <span className="text-xs font-bold text-zinc-650">
                        {currentLang === "en" ? "Drag & drop images here, or click to browse" : "اسحب وأفلت الصور هنا، أو اضغط للتصفح"}
                      </span>
                      <span className="text-[10px] text-zinc-400 leading-relaxed">
                        {currentLang === "en" ? "Supports JPG, PNG (Max 5MB each)" : "يدعم صيغ JPG، PNG (حد أقصى 5 ميجابايت لكل صورة)"}
                      </span>
                      
                      <input
                        id="maintenance-image-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            const filesArray = Array.from(e.target.files);
                            const nextFiles = [...selectedFiles, ...filesArray].slice(0, 3);
                            setSelectedFiles(nextFiles);
                            
                            const previews = nextFiles.map(file => URL.createObjectURL(file));
                            setFilePreviews(previews);
                          }
                        }}
                      />
                    </div>

                    {/* Previews gallery */}
                    {filePreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        {filePreviews.map((preview, idx) => (
                          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100">
                            <img 
                              src={preview} 
                              alt={`preview-${idx}`} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const updatedFiles = selectedFiles.filter((_, i) => i !== idx);
                                const updatedPreviews = filePreviews.filter((_, i) => i !== idx);
                                setSelectedFiles(updatedFiles);
                                setFilePreviews(updatedPreviews);
                              }}
                              className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md transition-colors cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3.5 rounded-xl text-start leading-relaxed flex items-center gap-2">
                      <span>⚠️ {errorMsg}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2 bg-zinc-950 hover:bg-zinc-850 text-white font-extrabold py-3.5 rounded-2xl text-xs transition-colors cursor-pointer disabled:bg-zinc-300 disabled:cursor-not-allowed shadow-md"
                  >
                    <Send className="w-4 h-4 rtl:rotate-180" />
                    <span>
                      {isSubmitting 
                        ? (currentLang === "en" ? "Sending Request..." : "جاري إرسال الطلب...") 
                        : (currentLang === "en" ? "Submit Maintenance Request" : "تقديم طلب صيانة معتمد")}
                    </span>
                  </button>
                </form>
              )}
            </div>

          </div>

        </div>

      </div>

      <ContactMethodPicker
        isOpen={isContactPickerOpen}
        onClose={() => setIsContactPickerOpen(false)}
        title={currentLang === "en" ? "Maintenance & Technical Support Request" : "طلب دعم صيانة ومساعدة فنية"}
        subtitle={currentLang === "en" ? "Select your preferred contact channel to connect with technical support" : "اختر قناتك المفضلة للتواصل المباشر مع الدعم الفني للصفوة وبدء تشخيص العطل"}
        customMessage={quickMessage}
        customSubject={currentLang === "en" ? "Instant Maintenance & Technical Support Request" : "طلب دعم وصيانة فورية"}
      />
    </div>
  );
}
