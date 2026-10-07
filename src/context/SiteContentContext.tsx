import React, { createContext, useContext, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getSupabase } from "../lib/supabase";
import { companyInfo } from "../data/placeholder";

// 1. Define all default content keys and values mapping directly to hardcoded elements
export const DEFAULT_CONTENT: Record<string, string> = {
  // --- Home Page ---
  home_hero_badge: "الوكيل الرسمي والمعتمد لأقوى الأجهزة المنزلية والكهربائية",
  home_hero_title: companyInfo.name,
  home_hero_tagline: companyInfo.tagline,
  home_hero_description: companyInfo.description,
  home_hero_image: "/src/assets/images/industrial_tools_hero_1783623168872.jpg",
  home_maint_section_title: "صيانة منزلية أصلية بقطع غيار معتمدة",
  home_maint_section_desc: "لا نكتفي ببيع المنتجات فحسب، بل لدينا مركز صيانة متكامل مجهز بأحدث أدوات الفحص، مع فريق من المهندسين والفنيين المدربين لضمان بقاء أجهزتك المنزلية بأفضل حالة تشغيلية ممكنة وبأقل التكاليف وبأعلى جودة وأمان.",

  // --- Warranty & Maintenance Page ---
  warranty_hero_badge: "خدمة ما بعد البيع والدعم المعتمد",
  warranty_hero_title: "صيانة منزلية أصلية بقطع غيار معتمدة وضمان حقيقي",
  warranty_hero_description: `في شركة ${companyInfo.name}، نلتزم بتقديم أعلى مستويات الدعم الفني لأجهزتك المنزلية والكهربائية لضمان كفاءة تشغيلها وعمرها الافتراضي الطويل. نعتمد فقط على قطع غيار أصلية بنسبة 100% من المصانع وبإشراف مهندسين متخصصين وفنيين محترفين.`,
  warranty_duration_text: "12 شهراً كاملة",
  warranty_duration_desc: "يسري الضمان من تاريخ الشراء المدون في الفاتورة الرسمية أو بطاقة الضمان.",
  warranty_level_text: "قطع غيار أصلية 100%",
  warranty_level_desc: "استبدال مجاني للأجزاء التالفة طوال فترة الضمان ضد عيوب الصناعة مع تقديم فاتورة الصيانة المعتمدة.",
  warranty_covered_terms: "الأعطال الفنية والعيوب المصنعية الناتجة عن التشغيل والظروف العادية للأجهزة المنزلية.\nعيوب المواد الخام وجودة التصنيع من المصنع مباشرة.\nأخطاء التجميع الداخلي للأجزاء الميكانيكية والكهربائية للمحركات.",
  warranty_not_covered_terms: "الأعطال الناتجة عن سوء الاستخدام، التحميل الزائد، أو سقوط الأجهزة وصدمها.\nالأضرار الناجمة عن سوء التوصيل الكهربائي أو عدم ثبات شدة التيار بمقر العميل.\nالتشغيل على تيار كهربائي غير مطابق للمواصفات الفنية الموصى بها في الكتيب.\nتنبيه هام: محاولة فتح الجهاز، تعديله، أو عمل صيانة له خارج مركز الصيانة المعتمد لشركة الصفوة يسقط الضمان فوراً.",
  warranty_note: "الرجاء الاحتفاظ بفاتورة الشراء الأصلية وبطاقة الضمان المختومة من الوكيل لتقديمها عند طلب الصيانة لضمان إثبات تاريخ الشراء وحالة التفعيل.",
  maintenance_terms_title: "مزايا وشروط الصيانة الدورية والخارجية",
  maintenance_terms_desc: "خدمة احترافية ممتدة وسريعة حتى بعد انتهاء فترة الضمان",
  maintenance_term_1_title: "فحص وتحديد دقيق للمشكلات",
  maintenance_term_1_desc: "يتم فحص الأجهزة المنزلية باستخدام أجهزة قياس تشخيصية متطورة لتحديد سبب العطل الفعلي بدقة وتجنب التغيير العشوائي للقطع.",
  maintenance_term_2_title: "توفير قطع الغيار بأسعار مخفضة",
  maintenance_term_2_desc: "نوفر كافة قطع الغيار ومستلزمات التشغيل كالمحركات، الكروت الإلكترونية، السيور ومفاتيح التشغيل بأسعار المصنع الأصلية المخفضة مع تقديم ضمان على قطع الغيار المستبدلة.",
  maintenance_term_3_title: "شفافية كاملة وتكاليف واضحة",
  maintenance_term_3_desc: "بعد انتهاء فترة الضمان، نقوم بتقديم فحص فني مبدئي مجاني وتقدير إجمالي لتكلفة الصيانة والمصنعية قبل البدء في التنفيذ ليكون العميل على دراية كاملة بجميع التفاصيل.",

  // --- About Us Page ---
  about_hero_title: `شركة ${companyInfo.name} للأجهزة المنزلية والكهربائية`,
  about_hero_description: "تأسست الشركة لتقديم حلول متطورة وأجهزة منزلية متميزة تدوم طويلاً لتسهيل وتحسين جودة الحياة اليومية لكل عائلة في مصر والشرق الأوسط.",
  about_banner_badge: "تأسسنا عام 2011",
  about_banner_text: "نسير بخطى ثابتة نحو توفير أرقى الابتكارات والأجهزة المنزلية المريحة",
  about_mission_title: "رسالتنا",
  about_mission_desc: "نسعى دائماً لتوفير أجهزة منزلية وكهربائية عالية الكفاءة بمواصفات مطابقة لأعلى المعايير العالمية، بأسعار تنافسية تناسب السوق المحلي، مع تقديم دعم فني وصيانة منزلية احترافية لعملائنا لتمكينهم من الاستمتاع بأعلى درجات الراحة والأمان.",
  about_vision_title: "رؤيتنا",
  about_vision_desc: "أن نكون الخيار الأول والوكيل الأبرز لكل منزل وعائلة في مصر والشرق الأوسط تبحث عن الأجهزة الموثوقة التي تتميز بالجمال والتحمل الفائق والذكاء التكنولوجي الحديث.",
  about_why_choose_us: `لماذا يختار ملايين العملاء شركة ${companyInfo.name}؟`,
  about_value_1_title: "الجودة والضمان الصارم",
  about_value_1_desc: "نخضع جميع الأجهزة لاختبارات أداء وسلامة صارمة قبل طرحها لضمان كفاءة تشغيلها ومطابقتها للمواصفات القياسية.",
  about_value_2_title: "أفضل خدمة صيانة ما بعد البيع",
  about_value_2_desc: "شراكتنا معك تبدأ بعد الشراء؛ حيث نوفر فريقاً سريعاً لخدمة الصيانة المنزلية وتوفير قطع الغيار الأصلية مع ضمان معتمد.",
  about_value_3_title: "التطور والتوفير الذكي",
  about_value_3_desc: "نهتم بتوفير أجهزة كهربائية مجهزة بمحركات إنفرتر الذكية الموفرة للطاقة بنسب عالية وذات أداء فائق الهدوء وعمر أطول للجهاز.",
  about_page_image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=1200",

  // --- Corporate Supplies Banner ---
  corporate_banner_badge: "قسم التوريدات والطلبات الخاصة للشركات والمتاجر",
  corporate_banner_title: "هل تبحث عن توريد كميات أو تجهيز متجر وشركة بالكامل؟",
  corporate_banner_desc: "نوفر عروض أسعار خاصة وتسهيلات توريد للشركات والمتاجر والتجار بأسعار تنافسية وضمان رسمي معتمد مع إمكانية توفير أصناف خاصة بطلب مباشر.",
  corporate_banner_btn_quote: "طلب تسعيرة وتوريد خاص",
  corporate_banner_btn_call: "الاتصال المباشر بالمبيعات",
  corporate_banner_note: "نلتزم بتوفير فواتير رسمية معتمدة وقطع غيار أصلية لجميع التوريدات",

  // --- Footer & Contact details ---
  maintenance_feature_enabled: "true",
  featured_products_section_enabled: "true",
  brands_section_enabled: "true",
  product_contact_button_enabled: "true",
  ai_translation_suggestion_enabled: "false",
  footer_phone: companyInfo.phone,
  footer_email: companyInfo.email,
  footer_address: companyInfo.address,
  footer_whatsapp_number: companyInfo.whatsapp,
  footer_facebook: companyInfo.socials.facebook,
  footer_instagram: companyInfo.socials.instagram,
  footer_linkedin: companyInfo.socials.linkedin,
  top_bar_badge_text: "الكتالوج الرسمي المعتمد 2026",
  site_logo: "",
};

// Default English Content Fallbacks
export const DEFAULT_CONTENT_EN: Record<string, string> = {
  // --- Home Page ---
  home_hero_badge: "Official & Certified Dealer for Leading Home Appliances",
  home_hero_title: companyInfo.englishName,
  home_hero_tagline: "Quality You Deserve, Long-Lasting Comfort",
  home_hero_description: "The leading authorized distributor for top-quality home and electrical appliances. Offering factory warranties, certified maintenance, and rapid customer support.",
  home_hero_image: "/src/assets/images/industrial_tools_hero_1783623168872.jpg",
  home_maint_section_title: "Certified Home Care with 100% Genuine Spare Parts",
  home_maint_section_desc: "We don't just sell appliances; we operate an integrated service center equipped with modern diagnostic tools and trained engineers to keep your home appliances running smoothly at minimal cost.",

  // --- Warranty & Maintenance Page ---
  warranty_hero_badge: "After-Sales Service & Certified Support",
  warranty_hero_title: "Certified Home Maintenance with Genuine Parts & Warranty",
  warranty_hero_description: `At ${companyInfo.englishName}, we are committed to providing top-tier technical support for your home appliances to ensure long operational lifespan and maximum efficiency, using 100% original factory spare parts.`,
  warranty_duration_text: "12 Full Months",
  warranty_duration_desc: "Warranty is valid from the purchase date stated on the official invoice or warranty card.",
  warranty_level_text: "100% Genuine Spare Parts",
  warranty_level_desc: "Free replacement of defective components during warranty against manufacturing defects with official service receipt.",
  warranty_covered_terms: "Technical faults and manufacturing defects resulting from normal household operation.\nDirect material and workmanship defects straight from the factory.\nInternal assembly faults in mechanical or electrical motor parts.",
  warranty_not_covered_terms: "Faults caused by misuse, electrical overloading, drops, or impacts.\nDamage from improper electrical connections or voltage instability.\nOperation on power supply non-compliant with technical manual specs.\nImportant Notice: Unsealing or servicing the device outside Al-Safwa authorized centers voids the warranty immediately.",
  warranty_note: "Please keep your original purchase invoice and stamped warranty card for verification when requesting service.",
  maintenance_terms_title: "Periodic & External Maintenance Terms & Benefits",
  maintenance_terms_desc: "Extended professional service even after warranty expiration",
  maintenance_term_1_title: "Accurate Diagnostics & Fault Inspection",
  maintenance_term_1_desc: "Home appliances are examined using advanced diagnostic meters to precisely pinpoint failure causes and avoid unnecessary part replacements.",
  maintenance_term_2_title: "Genuine Spare Parts at Discounted Rates",
  maintenance_term_2_desc: "We supply all motors, electronic boards, belts, and power switches at original discounted factory prices with certified warranties.",
  maintenance_term_3_title: "Full Transparency & Clear Costs",
  maintenance_term_3_desc: "After warranty expiration, we offer a free initial technical inspection and cost estimate before proceeding, keeping you fully informed.",

  // --- About Us Page ---
  about_hero_title: `${companyInfo.englishName} Home & Electrical Appliances`,
  about_hero_description: "Founded to deliver advanced, long-lasting home appliance solutions that improve daily life for families in Egypt and the Middle East.",
  about_banner_badge: "Established 2011",
  about_banner_text: "Steadily advancing towards offering premier, comfortable home innovations",
  about_mission_title: "Our Mission",
  about_mission_desc: "To provide high-efficiency appliances conforming to top global standards at competitive prices, paired with professional after-sales support.",
  about_vision_title: "Our Vision",
  about_vision_desc: "To be the leading distributor and trusted partner for every household seeking reliable, elegant, and technologically advanced appliances.",
  about_why_choose_us: `Why do millions of customers choose ${companyInfo.englishName}?`,
  about_value_1_title: "Strict Quality & Warranty",
  about_value_1_desc: "All appliances undergo rigorous performance and safety testing before release to guarantee peak efficiency.",
  about_value_2_title: "Premier After-Sales Maintenance",
  about_value_2_desc: "Our partnership starts after purchase; providing rapid home maintenance and 100% genuine parts with official guarantees.",
  about_value_3_title: "Smart Energy Innovations",
  about_value_3_desc: "We focus on Smart Inverter motors that minimize energy consumption while delivering ultra-quiet, long-lasting performance.",
  about_page_image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=1200",

  // --- Corporate Supplies Banner ---
  corporate_banner_badge: "Corporate & Retail Store Supply Requests",
  corporate_banner_title: "Looking for Bulk Supplies or Equipping Stores & Companies?",
  corporate_banner_desc: "We offer special price quotes and supply facilities for companies, stores, and retailers at competitive prices with official warranty.",
  corporate_banner_btn_quote: "Request Quotation & Supply",
  corporate_banner_btn_call: "Direct Call to Sales",
  corporate_banner_note: "We provide official tax invoices and genuine spare parts for all corporate supplies.",

  // --- Footer & Contact details ---
  footer_phone: companyInfo.phone,
  footer_email: companyInfo.email,
  footer_address: "Main Showroom: Al-Tayaran St., Nasr City, Cairo, Egypt",
  footer_whatsapp_number: companyInfo.whatsapp,
  footer_facebook: companyInfo.socials.facebook,
  footer_instagram: companyInfo.socials.instagram,
  footer_linkedin: companyInfo.socials.linkedin,
  top_bar_badge_text: "Official Certified Catalog 2026",
  site_logo: "",
};

export interface ContentMetadataItem {
  label: string;
  section: string;
  type?: "text" | "image" | "boolean";
}

// 2. Metadata details in Arabic to display nicely on the admin editing panel
export const CONTENT_METADATA: Record<string, ContentMetadataItem> = {
  // Home Page
  home_hero_badge: { label: "البادج العلوي الصغير في الهيرو", section: "الصفحة الرئيسية" },
  home_hero_title: { label: "عنوان الهيرو الرئيسي (اسم الشركة)", section: "الصفحة الرئيسية" },
  home_hero_tagline: { label: "السطر الترويجي للهيرو (Tagline)", section: "الصفحة الرئيسية" },
  home_hero_description: { label: "الوصف التفصيلي في الهيرو", section: "الصفحة الرئيسية" },
  home_hero_image: { label: "صورة هيرو الصفحة الرئيسية", section: "الصفحة الرئيسية", type: "image" },
  home_maint_section_title: { label: "عنوان سطر الصيانة المعتمدة بالرئيسية", section: "الصفحة الرئيسية" },
  home_maint_section_desc: { label: "وصف سطر الصيانة المعتمدة بالرئيسية", section: "الصفحة الرئيسية" },

  // Warranty
  warranty_hero_badge: { label: "البادج العلوي بصفحة الضمان", section: "صفحة الضمان والصيانة" },
  warranty_hero_title: { label: "العنوان الرئيسي لصفحة الضمان", section: "صفحة الضمان والصيانة" },
  warranty_hero_description: { label: "الوصف التفصيلي لصفحة الضمان والخدمة", section: "صفحة الضمان والصيانة" },
  warranty_duration_text: { label: "نص مدة الضمان الأساسي", section: "صفحة الضمان والصيانة" },
  warranty_duration_desc: { label: "وصف شروط سريان مدة الضمان", section: "صفحة الضمان والصيانة" },
  warranty_level_text: { label: "نص مستوى قطع غيار الضمان", section: "صفحة الضمان والصيانة" },
  warranty_level_desc: { label: "تفاصيل استبدال قطع الغيار", section: "صفحة الضمان والصيانة" },
  warranty_covered_terms: { label: "البنود التي يغطيها الضمان (كل بند في سطر)", section: "صفحة الضمان والصيانة" },
  warranty_not_covered_terms: { label: "البنود المستثناة من الضمان (كل بند في سطر)", section: "صفحة الضمان والصيانة" },
  warranty_note: { label: "الملاحظة الهامة لبطاقة الضمان وفاتورة الشراء", section: "صفحة الضمان والصيانة" },
  maintenance_terms_title: { label: "عنوان قسم شروط الصيانة ومزاياها", section: "صفحة الضمان والصيانة" },
  maintenance_terms_desc: { label: "الوصف الفرعي لقسم الصيانة", section: "صفحة الضمان والصيانة" },
  maintenance_term_1_title: { label: "ميزة الصيانة 1 - العنوان", section: "صفحة الضمان والصيانة" },
  maintenance_term_1_desc: { label: "ميزة الصيانة 1 - التفاصيل", section: "صفحة الضمان والصيانة" },
  maintenance_term_2_title: { label: "ميزة الصيانة 2 - العنوان", section: "صفحة الضمان والصيانة" },
  maintenance_term_2_desc: { label: "ميزة الصيانة 2 - التفاصيل", section: "صفحة الضمان والصيانة" },
  maintenance_term_3_title: { label: "ميزة الصيانة 3 - العنوان", section: "صفحة الضمان والصيانة" },
  maintenance_term_3_desc: { label: "ميزة الصيانة 3 - التفاصيل", section: "صفحة الضمان والصيانة" },

  // About Page
  about_hero_title: { label: "عنوان صفحة من نحن الرئيسي", section: "صفحة من نحن" },
  about_hero_description: { label: "الوصف الفرعي لصفحة من نحن", section: "صفحة من نحن" },
  about_banner_badge: { label: "عام التأسيس أو البادج المميز", section: "صفحة من نحن" },
  about_banner_text: { label: "الشعار المكتوب على البانر الإعلاني", section: "صفحة من نحن" },
  about_mission_title: { label: "عنوان قسم رسالتنا", section: "صفحة من نحن" },
  about_mission_desc: { label: "تفاصيل رسالة الشركة", section: "صفحة من نحن" },
  about_vision_title: { label: "عنوان قسم رؤيتنا", section: "صفحة من نحن" },
  about_vision_desc: { label: "تفاصيل رؤية الشركة المستقبلية", section: "صفحة من نحن" },
  about_why_choose_us: { label: "عنوان قسم 'لماذا يختارنا العملاء'", section: "صفحة من نحن" },
  about_value_1_title: { label: "قيمة الشركة 1 - العنوان", section: "صفحة من نحن" },
  about_value_1_desc: { label: "قيمة الشركة 1 - التفاصيل", section: "صفحة من نحن" },
  about_value_2_title: { label: "قيمة الشركة 2 - العنوان", section: "صفحة من نحن" },
  about_value_2_desc: { label: "قيمة الشركة 2 - التفاصيل", section: "صفحة من نحن" },
  about_value_3_title: { label: "قيمة الشركة 3 - العنوان", section: "صفحة من نحن" },
  about_value_3_desc: { label: "قيمة الشركة 3 - التفاصيل", section: "صفحة من نحن" },
  about_page_image: { label: "صورة بانر صفحة من نحن الرئيسية", section: "صفحة من نحن", type: "image" },

  // --- Corporate Supplies Banner ---
  corporate_banner_badge: { label: "البادج العلوي لبانر توريدات الشركات", section: "بانر توريدات الشركات" },
  corporate_banner_title: { label: "عنوان بانر توريدات الشركات الرئيسي", section: "بانر توريدات الشركات" },
  corporate_banner_desc: { label: "الوصف التفصيلي لبانر التوريدات", section: "بانر توريدات الشركات" },
  corporate_banner_btn_quote: { label: "نص زرار طلب التسعيرة والواتساب", section: "بانر توريدات الشركات" },
  corporate_banner_btn_call: { label: "نص زرار الاتصال المباشر بالمبيعات", section: "بانر توريدات الشركات" },
  corporate_banner_note: { label: "الملاحظة السفلية لبانر التوريدات", section: "بانر توريدات الشركات" },

  // --- Footer & Contact details ---
  footer_phone: { label: "رقم هاتف الفوتر", section: "بيانات التواصل والفوتر" },
  footer_email: { label: "البريد الإلكتروني للفوتر", section: "بيانات التواصل والفوتر" },
  footer_address: { label: "العنوان الرئيسي للفوتر", section: "بيانات التواصل والفوتر" },
  footer_whatsapp_number: { label: "رقم واتساب الفوتر", section: "بيانات التواصل والفوتر" },
  footer_facebook: { label: "رابط صفحة فيسبوك في الفوتر", section: "بيانات التواصل والفوتر" },
  footer_instagram: { label: "رابط صفحة إنستجرام في الفوتر", section: "بيانات التواصل والفوتر" },
  footer_linkedin: { label: "رابط صفحة لينكد إن في الفوتر", section: "بيانات التواصل والفوتر" },
  top_bar_badge_text: { label: "نص بادج الشريط العلوي (الكتالوج المعتمد)", section: "بيانات التواصل والفوتر" },
  site_logo: { label: "شعار الشركة والموقع (اللوجو)", section: "بيانات التواصل والفوتر", type: "image" },
  maintenance_feature_enabled: { label: "تفعيل قسم الصيانة والضمان في الموقع العام", section: "بيانات التواصل والفوتر", type: "boolean" },
  featured_products_section_enabled: { label: "تفعيل قسم الأكثر طلبًا بالصفحة الرئيسية", section: "الصفحة الرئيسية", type: "boolean" },
  brands_section_enabled: { label: "تفعيل قسم العلامات التجارية بالصفحة الرئيسية", section: "الصفحة الرئيسية", type: "boolean" },
  product_contact_button_enabled: { label: "تفعيل زرار تواصل للطلب في تفاصيل وبطاقة المنتج", section: "الصفحة الرئيسية", type: "boolean" },
  ai_translation_suggestion_enabled: { label: "تفعيل اقتراح الترجمة التلقائية (Google Translate API)", section: "بيانات التواصل والفوتر", type: "boolean" },
};

interface SiteContentContextType {
  content: Record<string, string>;
  contentEn: Record<string, string>;
  loading: boolean;
  getText: (key: string, defaultVal?: string, langOverride?: string) => string;
  updateText: (key: string, value: string, valueEn?: string) => Promise<boolean>;
  refreshContent: () => Promise<void>;
}

const SiteContentContext = createContext<SiteContentContextType | undefined>(undefined);

export function SiteContentProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || "ar";

  const [content, setContent] = useState<Record<string, string>>(() => ({ ...DEFAULT_CONTENT }));
  const [contentEn, setContentEn] = useState<Record<string, string>>(() => ({ ...DEFAULT_CONTENT_EN }));
  const [loading, setLoading] = useState(true);

  const fetchDatabaseContent = async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      // First try selecting value_en alongside key, value
      const { data, error } = await supabase
        .from("site_content")
        .select("key, value, value_en");

      if (error) {
        // Fallback if value_en column isn't created yet in DB schema
        console.warn("Querying site_content with value_en failed, trying key, value fallback:", error.message);
        const fallbackQuery = await supabase.from("site_content").select("key, value");
        if (fallbackQuery.data) {
          const dbContentAr: Record<string, string> = {};
          fallbackQuery.data.forEach((row: { key: string; value: string }) => {
            if (row.value !== undefined) dbContentAr[row.key] = row.value;
          });
          setContent((prev) => ({ ...prev, ...dbContentAr }));
        }
      } else if (data && data.length > 0) {
        const dbContentAr: Record<string, string> = {};
        const dbContentEn: Record<string, string> = {};
        data.forEach((row: { key: string; value?: string; value_en?: string }) => {
          if (row.value !== undefined) dbContentAr[row.key] = row.value;
          if (row.value_en !== undefined && row.value_en !== null) dbContentEn[row.key] = row.value_en;
        });

        setContent((prev) => ({ ...prev, ...dbContentAr }));
        setContentEn((prev) => ({ ...prev, ...dbContentEn }));
      }
    } catch (err) {
      console.error("Exception loading site_content from database:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseContent();
  }, []);

  const getText = (key: string, defaultVal?: string, langOverride?: string): string => {
    // 1. Boolean Settings & Feature Toggles (Global Configuration - Language Agnostic)
    const meta = CONTENT_METADATA[key];
    const isBooleanSetting = 
      meta?.type === "boolean" ||
      key === "maintenance_feature_enabled" ||
      key === "featured_products_section_enabled" ||
      key === "brands_section_enabled" ||
      key === "product_contact_button_enabled";

    if (isBooleanSetting) {
      if (content[key] !== undefined && content[key] !== "") {
        return content[key];
      }
      return defaultVal !== undefined ? defaultVal : (DEFAULT_CONTENT[key] || "true");
    }

    // 2. Translatable Content (Text & Images)
    const activeLang = langOverride || currentLang;

    if (activeLang === "en") {
      // 1. Saved English value in database
      if (contentEn[key] !== undefined && contentEn[key].trim() !== "") {
        return contentEn[key];
      }
      // 2. Default English value in DEFAULT_CONTENT_EN
      if (DEFAULT_CONTENT_EN[key] !== undefined && DEFAULT_CONTENT_EN[key].trim() !== "") {
        return DEFAULT_CONTENT_EN[key];
      }
      // 3. Fallback to Arabic saved value or defaultVal or DEFAULT_CONTENT
      return content[key] !== undefined && content[key].trim() !== ""
        ? content[key]
        : (defaultVal || DEFAULT_CONTENT[key] || "");
    }

    // Arabic
    return content[key] !== undefined && content[key].trim() !== ""
      ? content[key]
      : (defaultVal || DEFAULT_CONTENT[key] || "");
  };

  const updateText = async (key: string, value: string, valueEn?: string): Promise<boolean> => {
    // Update local state immediately for instant feedback
    setContent((prev) => ({ ...prev, [key]: value }));
    if (valueEn !== undefined) {
      setContentEn((prev) => ({ ...prev, [key]: valueEn }));
    }

    const supabase = getSupabase();
    if (!supabase) return true;

    const meta = CONTENT_METADATA[key];
    const contentType = meta?.type || "text";

    const payload: any = {
      key,
      value,
      content_type: contentType,
      updated_at: new Date().toISOString(),
    };

    if (valueEn !== undefined) {
      payload.value_en = valueEn;
    }

    try {
      let { error } = await supabase
        .from("site_content")
        .upsert(payload, { onConflict: "key" });

      if (error) {
        console.warn(`Error during upserting [${key}] in Supabase, attempting fallback:`, error.message);
        // If value_en column fails, try payload without value_en
        delete payload.value_en;
        const { error: fallbackError } = await supabase
          .from("site_content")
          .upsert(payload, { onConflict: "key" });

        if (fallbackError) {
          // If content_type fails, try minimal payload
          await supabase.from("site_content").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
        }
      }
      return true;
    } catch (err) {
      console.error(`Exception saving site_content key [${key}]:`, err);
      return false;
    }
  };

  return (
    <SiteContentContext.Provider
      value={{
        content,
        contentEn,
        loading,
        getText,
        updateText,
        refreshContent: fetchDatabaseContent,
      }}
    >
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent() {
  const context = useContext(SiteContentContext);
  if (context === undefined) {
    throw new Error("useSiteContent must be used within a SiteContentProvider");
  }
  return context;
}
