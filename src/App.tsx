import React, { useState, useEffect, FormEvent } from "react";
import { companyInfo, placeholderCategories, placeholderProducts, placeholderFeaturedProducts } from "./data/placeholder";
import Header from "./components/Header";
import Hero from "./components/Hero";
import CategoryCard from "./components/CategoryCard";
import ProductCard from "./components/ProductCard";
import WhatsAppBanner from "./components/WhatsAppBanner";
import Footer from "./components/Footer";
import CategoryPage from "./components/CategoryPage";
import BrandPage from "./components/BrandPage";
import ProductDetailPage from "./components/ProductDetailPage";
import FavoritesPage from "./components/FavoritesPage";
import MaintenancePage from "./components/MaintenancePage";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import AdminCategories from "./components/AdminCategories";
import AdminProducts from "./components/AdminProducts";
import AdminMaintenanceRequests from "./components/AdminMaintenanceRequests";
import AdminContactRequests from "./components/AdminContactRequests";
import AdminContent from "./components/AdminContent";
import AdminBrands, { defaultBrands } from "./components/AdminBrands";
import ContactMethodPicker from "./components/ContactMethodPicker";
import AdminSidebar from "./components/AdminSidebar";
import AdminSettings from "./components/AdminSettings";
import { Category, Product, Brand } from "./types";
import { getSupabase } from "./lib/supabase";
import { useSiteContent } from "./context/SiteContentContext";
import { useTranslation } from "react-i18next";
import { getCategoryName, getBrandName } from "./utils/localize";
import { 
  Building, 
  CheckCircle2, 
  Send, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  Award,
  SlidersHorizontal,
  ChevronLeft,
  MessageCircle
} from "lucide-react";

export default function App() {
  const { getText } = useSiteContent();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "ar";
  const isMaintenanceEnabled = getText("maintenance_feature_enabled", "true") !== "false";
  const isFeaturedEnabled = getText("featured_products_section_enabled", "true") !== "false";
  const isBrandsEnabled = getText("brands_section_enabled", "true") !== "false";
  type ViewState = 
    | { type: "home" } 
    | { type: "about" } 
    | { type: "contact" } 
    | { type: "favorites" }
    | { type: "maintenance" }
    | { type: "featured" }
    | { type: "brands" }
    | { type: "category"; slug: string } 
    | { type: "brand"; slug: string } 
    | { type: "product"; slug: string }
    | { type: "admin-login" }
    | { type: "admin-dashboard" }
    | { type: "admin-categories" }
    | { type: "admin-products" }
    | { type: "admin-maintenance" }
    | { type: "admin-content" }
    | { type: "admin-brands" }
    | { type: "admin-contact" }
    | { type: "admin-settings" };

  const [view, setView] = useState<ViewState>({ type: "home" });
  const [isAppContactPickerOpen, setIsAppContactPickerOpen] = useState(false);

  // Stateful categories, products, and auth session
  const [categories, setCategories] = useState<Category[]>(placeholderCategories);
  const [products, setProducts] = useState<Product[]>(placeholderProducts);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Sync session state on mount
  useEffect(() => {
    const supabase = getSupabase();
    if (supabase) {
      setAuthLoading(true);
      supabase.auth.getSession().then(({ data: { session: sbSession } }) => {
        setSession(sbSession);
        setAuthLoading(false);
      }).catch((err) => {
        console.error("Error fetching session:", err);
        setAuthLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sbSession) => {
        setSession(sbSession);
        setAuthLoading(false);
      });

      return () => subscription.unsubscribe();
    } else {
      setAuthLoading(false);
    }
  }, []);

  // Fetch Categories, Products & Gallery Images dynamically
  useEffect(() => {
    const loadData = async () => {
      // Clear legacy heavy local storage keys to free up quota
      try {
        localStorage.removeItem("safwa_local_products");
        localStorage.removeItem("safwa_local_categories");
        localStorage.removeItem("safwa_features_cache");
      } catch (err) {
        console.warn("Failed to clear legacy local storage keys:", err);
      }

      let mergedCats = [...placeholderCategories];
      let mergedProds = [...placeholderProducts];

      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data: catData, error: catError } = await supabase
            .from("categories")
            .select("*")
            .order("name");
          
          const { data: prodData, error: prodError } = await supabase
            .from("products")
            .select("*")
            .order("created_at", { ascending: false });

          const { data: imgData, error: imgError } = await supabase
            .from("product_images")
            .select("*")
            .order("sort_order");

          if (!catError && catData && catData.length > 0) {
            const mappedCats = catData.map((c: any) => {
              const count = prodData ? prodData.filter((p: any) => String(p.category_id).trim().toLowerCase() === String(c.id).trim().toLowerCase()).length : 0;
              return {
                id: c.id,
                name: c.name,
                name_en: c.name_en || undefined,
                slug: c.slug,
                image_url: c.image_url,
                description: c.description,
                description_en: c.description_en || undefined,
                productCount: count
              };
            });
            mergedCats = mappedCats;
          }

          if (!prodError && prodData && prodData.length > 0) {
            const mappedProds = prodData.map((p: any) => {
              const pImages = imgData ? imgData.filter((img: any) => img.product_id === p.id) : [];
              const sortedUrls = pImages.length > 0 
                ? pImages.sort((a, b) => a.sort_order - b.sort_order).map(img => img.image_url)
                : [p.image_url || "https://images.unsplash.com/photo-1540103711724-ee7234656248?auto=format&fit=crop&q=80&w=800"];

              return {
                id: p.id,
                category_id: p.category_id,
                brand_id: p.brand_id,
                name: p.name,
                name_en: p.name_en || undefined,
                slug: p.slug,
                short_description: p.short_description,
                short_description_en: p.short_description_en || undefined,
                full_description: p.full_description,
                full_description_en: p.full_description_en || undefined,
                specs: typeof p.specs === "string" ? JSON.parse(p.specs) : (p.specs || {}),
                specs_en: typeof p.specs_en === "string" ? JSON.parse(p.specs_en) : (p.specs_en || undefined),
                price: p.price ? Number(p.price) : null,
                images: sortedUrls,
                is_featured: p.is_featured,
                is_available: p.is_available !== false,
                features: typeof p.features === "string" ? JSON.parse(p.features) : (p.features || []),
                features_en: typeof p.features_en === "string" ? JSON.parse(p.features_en) : (p.features_en || undefined),
                created_at: p.created_at
              };
            });
            mergedProds = mappedProds;
          }
        } catch (err) {
          console.error("Supabase load error:", err);
        }
      }

      // Merge local product translations cache if available
      try {
        const localTransStr = localStorage.getItem("safwa_local_product_translations");
        if (localTransStr) {
          const localTrans = JSON.parse(localTransStr);
          mergedProds = mergedProds.map(prod => {
            const override = localTrans[prod.id];
            if (override) {
              return {
                ...prod,
                name_en: override.name_en || prod.name_en,
                short_description_en: override.short_description_en || prod.short_description_en,
                full_description_en: override.full_description_en || prod.full_description_en,
                specs_en: (override.specs_en && Object.keys(override.specs_en).length > 0) ? override.specs_en : prod.specs_en,
                features_en: (override.features_en && override.features_en.length > 0) ? override.features_en : prod.features_en,
              };
            }
            return prod;
          });
        }
      } catch (e) {
        console.warn("Could not load local product translations cache:", e);
      }

      // Dynamically calculate productCount for categories based on actual active mergedProds list
      const finalCats = mergedCats.map(c => {
        const count = mergedProds.filter(p => String(p.category_id).trim().toLowerCase() === String(c.id).trim().toLowerCase()).length;
        return {
          ...c,
          productCount: count
        };
      });

      // Load brands
      let mergedBrands = [];
      try {
        const stored = localStorage.getItem("safwa_local_brands");
        if (stored) {
          mergedBrands = JSON.parse(stored);
        } else {
          mergedBrands = [...defaultBrands];
          localStorage.setItem("safwa_local_brands", JSON.stringify(mergedBrands));
        }
      } catch (e) {
        console.error("Failed to load local brands:", e);
        mergedBrands = [...defaultBrands];
      }

      if (supabase) {
        try {
          const { data: brandData, error: brandError } = await supabase
            .from("brands")
            .select("*")
            .order("sort_order", { ascending: true });

          if (!brandError && brandData && brandData.length > 0) {
            mergedBrands = brandData;
          }
        } catch (err) {
          console.warn("Could not fetch brands from Supabase:", err);
        }
      }

      setCategories(finalCats);
      setProducts(mergedProds);
      setBrands(mergedBrands.sort((a, b) => a.sort_order - b.sort_order));
    };

    loadData();
  }, [refreshTrigger]);

  // Sync routing state with window.location.pathname
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === "/admin/login") {
        setView({ type: "admin-login" });
      } else if (path === "/admin" || path === "/admin/") {
        setView({ type: "admin-dashboard" });
      } else if (path === "/admin/categories") {
        setView({ type: "admin-categories" });
      } else if (path === "/admin/products") {
        setView({ type: "admin-products" });
      } else if (path === "/admin/brands") {
        setView({ type: "admin-brands" });
      } else if (path === "/admin/maintenance") {
        setView({ type: "admin-maintenance" });
      } else if (path === "/admin/contact") {
        setView({ type: "admin-contact" });
      } else if (path === "/admin/content") {
        setView({ type: "admin-content" });
      } else if (path === "/admin/settings") {
        setView({ type: "admin-settings" });
      } else if (path.startsWith("/category/")) {
        const slug = path.replace("/category/", "");
        setView({ type: "category", slug });
      } else if (path.startsWith("/brand/")) {
        const slug = path.replace("/brand/", "");
        setView({ type: "brand", slug });
      } else if (path.startsWith("/product/")) {
        const slug = path.replace("/product/", "");
        setView({ type: "product", slug });
      } else if (path === "/about") {
        setView({ type: "about" });
      } else if (path === "/contact") {
        setView({ type: "contact" });
      } else if (path === "/favorites") {
        setView({ type: "favorites" });
      } else if (path === "/maintenance") {
        setView({ type: "maintenance" });
      } else if (path === "/featured") {
        setView({ type: "featured" });
      } else if (path === "/brands") {
        setView({ type: "brands" });
      } else {
        setView({ type: "home" });
      }
    };

    handleLocationChange();
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  // Custom navigate helper that updates both address bar and component state
  const navigateTo = (newView: ViewState) => {
    let path = "/";
    if (newView.type === "admin-login") path = "/admin/login";
    else if (newView.type === "admin-dashboard") path = "/admin";
    else if (newView.type === "admin-categories") path = "/admin/categories";
    else if (newView.type === "admin-products") path = "/admin/products";
    else if (newView.type === "admin-brands") path = "/admin/brands";
    else if (newView.type === "admin-maintenance") path = "/admin/maintenance";
    else if (newView.type === "admin-contact") path = "/admin/contact";
    else if (newView.type === "admin-content") path = "/admin/content";
    else if (newView.type === "admin-settings") path = "/admin/settings";
    else if (newView.type === "category") path = `/category/${newView.slug}`;
    else if (newView.type === "brand") path = `/brand/${newView.slug}`;
    else if (newView.type === "product") path = `/product/${newView.slug}`;
    else if (newView.type === "about") path = "/about";
    else if (newView.type === "contact") path = "/contact";
    else if (newView.type === "favorites") path = "/favorites";
    else if (newView.type === "maintenance") path = "/maintenance";
    else if (newView.type === "featured") path = "/featured";
    else if (newView.type === "brands") path = "/brands";

    window.history.pushState(null, "", path);
    setView(newView);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isAdminPath = view.type.startsWith("admin-");
  const isLoginPage = view.type === "admin-login";

  // Security guard for all sub-admin pages
  useEffect(() => {
    if (isAdminPath && !isLoginPage && !session && !authLoading) {
      navigateTo({ type: "admin-login" });
    }
  }, [view.type, session, authLoading]);
  
  // States for simulated contact requests
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [middleName, setMiddleName] = useState(""); // Honeypot state
  const [submittedRequests, setSubmittedRequests] = useState<any[]>([]);
  const [isSuccessAlertOpen, setIsSuccessAlertOpen] = useState(false);
  const [lastSavedRecord, setLastSavedRecord] = useState<any>(null);

  // Load existing mock requests from localStorage to simulate persistent Supabase contact_requests
  useEffect(() => {
    const saved = localStorage.getItem("electrocore_contact_requests");
    if (saved) {
      try {
        setSubmittedRequests(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load requests", e);
      }
    }
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !message) return;

    setIsSubmitting(true);
    setSubmitError(null);

    // 1. Honeypot check
    if (middleName) {
      // Silent success (pretend submit succeeded to deceive spam bots)
      setName("");
      setPhone("");
      setMessage("");
      setMiddleName("");
      setIsSuccessAlertOpen(true);
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // 2. Rate Limiting Check (1 minute interval)
    const lastSubmit = localStorage.getItem("last_contact_submit_time");
    if (lastSubmit) {
      const timePassed = Date.now() - parseInt(lastSubmit, 10);
      if (timePassed < 60000) {
        setSubmitError("من فضلك انتظر دقيقة على الأقل قبل إرسال طلب جديد.");
        setIsSubmitting(false);
        return;
      }
    }

    // 3. Name validation
    if (name.trim().length < 3) {
      setSubmitError("يرجى إدخال اسم حقيقي صالح (أكثر من حرفين).");
      setIsSubmitting(false);
      return;
    }
    const nameLetterCheck = /[\u0600-\u06FFa-zA-Z]/g;
    const lettersCount = (name.match(nameLetterCheck) || []).length;
    if (lettersCount < 3) {
      setSubmitError("يرجى إدخال اسم حقيقي يحتوي على حروف صالحة.");
      setIsSubmitting(false);
      return;
    }

    // 4. Phone validation (Egyptian phone format starting with 01 and having 11 digits, or matching standard +20 prefix)
    const cleanPhone = phone.trim().replace(/[\s-()]/g, "");
    const egPhoneRegex = /^(01[0125]\d{8})$|^(\+?201[0125]\d{8})$|^00201[0125]\d{8}$/;
    if (!egPhoneRegex.test(cleanPhone)) {
      setSubmitError("يرجى إدخال رقم هاتف مصري صحيح (يبدأ بـ 01 ويتكون من 11 رقمًا).");
      setIsSubmitting(false);
      return;
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase
          .from("contact_requests")
          .insert([
            {
              name: name,
              phone: phone,
              message: message
            }
          ]);

        if (error) {
          console.error("Supabase error during contact request insert:", error);
          throw error;
        }
      } catch (err: any) {
        console.error("Failed to insert request to Supabase:", err);
        setSubmitError("عذرًا، فشل إرسال رسالتك بسبب مشكلة في الاتصال بقاعدة البيانات. يرجى المحاولة مرة أخرى.");
        setIsSubmitting(false);
        return;
      }
    } else {
      setSubmitError("عذرًا، خدمة الاتصال بقاعدة البيانات غير متوفرة حاليًا.");
      setIsSubmitting(false);
      return;
    }

    // Reset form and show success banner
    setName("");
    setPhone("");
    setMessage("");
    setMiddleName("");
    setIsSuccessAlertOpen(true);
    setIsSubmitting(false);
    
    // Save last submission timestamp to enforce rate limiting
    localStorage.setItem("last_contact_submit_time", Date.now().toString());
    
    // Auto-scroll to top of contact view
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategorySelect = (slug: string) => {
    navigateTo({ type: "category", slug });
  };

  const handleProductSelect = (slug: string) => {
    navigateTo({ type: "product", slug });
  };

  const handleScrollToSection = (sectionId: string) => {
    if (sectionId === "featured-products-section" && !isFeaturedEnabled) {
      navigateTo({ type: "featured" });
      return;
    }
    if (sectionId === "brands-section" && !isBrandsEnabled) {
      navigateTo({ type: "brands" });
      return;
    }
    if (view.type !== "home") {
      navigateTo({ type: "home" });
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans selection:bg-[#3e499e] selection:text-white">
      
      {/* 1. Header Navigation */}
      {!isAdminPath && (
        <Header 
          onNavigateToHome={() => navigateTo({ type: "home" })}
          onNavigateToAbout={() => navigateTo({ type: "about" })}
          onNavigateToContact={() => navigateTo({ type: "contact" })}
          onNavigateToFavorites={() => navigateTo({ type: "favorites" })}
          onNavigateToMaintenance={() => navigateTo({ type: "maintenance" })}
          onScrollToSection={handleScrollToSection}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-grow">
        {view.type === "home" && (
          <div>
            {/* 2. Hero Section */}
            <Hero 
              products={products}
              onExploreCatalog={() => {
                const brandsSection = document.getElementById("brands-section");
                if (brandsSection) brandsSection.scrollIntoView({ behavior: "smooth" });
              }}
              onContactUs={() => {
                navigateTo({ type: "contact" });
              }}
              onNavigateToMaintenance={() => {
                navigateTo({ type: "maintenance" });
              }}
            />

            {/* Brands Showcase Section */}
            {isBrandsEnabled && brands.length > 0 && (
              <section className="bg-zinc-100/70 py-10 border-y border-zinc-200/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
                  <div className="flex items-center justify-center gap-2">
                    <span className="h-px bg-zinc-300 w-12 sm:w-20"></span>
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2">
                      {currentLang === "en" ? "Authorized Brands & Key Partners" : "العلامات التجارية المعتمدة وشراكات النجاح"}
                    </span>
                    <span className="h-px bg-zinc-300 w-12 sm:w-20"></span>
                  </div>

                  {/* Auto-scrolling Marquee */}
                  <div className="relative w-full overflow-hidden py-2 select-none" dir="ltr">
                    <style dangerouslySetInnerHTML={{__html: `
                      @keyframes marquee-scroll {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                      }
                      .animate-marquee-scroll {
                        display: flex;
                        gap: 1.5rem; /* gap-6 is 1.5rem */
                        width: max-content;
                        animation: marquee-scroll 45s linear infinite;
                      }
                      .animate-marquee-scroll:hover {
                        animation-play-state: paused;
                      }
                    `}} />
                    
                    <div className="animate-marquee-scroll">
                      {[...brands, ...brands, ...brands, ...brands].map((brand, index) => (
                        <div 
                          key={`${brand.id}-${index}`}
                          onClick={() => navigateTo({ type: "brand", slug: brand.slug })}
                          className="bg-white hover:bg-zinc-50 border border-zinc-200/60 rounded-2xl p-4 flex items-center justify-center h-20 w-44 sm:w-52 transition-all hover:shadow-md hover:-translate-y-0.5 group cursor-pointer shrink-0"
                          title={getBrandName(brand, currentLang)}
                        >
                          {brand.logo_url ? (
                            <img 
                              src={brand.logo_url} 
                              alt={getBrandName(brand, currentLang)} 
                              className="max-w-full max-h-full object-contain filter grayscale hover:grayscale-0 contrast-125 transition-all duration-300"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="font-extrabold text-sm text-zinc-400 tracking-wider uppercase group-hover:text-[#3e499e] transition-colors">
                              {getBrandName(brand, currentLang)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 3. Brands Grid (Browse by Brand) */}
            <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20" id="brands-section">
              <div className="text-center space-y-3 mb-12">
                <span className="text-xs font-bold text-[#3e499e] uppercase tracking-widest bg-[#3e499e]/10 px-3 py-1 rounded-full">
                  {currentLang === "en" ? "Original Brands" : "العلامات التجارية الأصلية"}
                </span>
                <h2 className="text-3xl font-black text-zinc-900 tracking-tight sm:text-4xl">
                  {currentLang === "en" ? "Browse Products by Brand" : "تصفح المنتجات حسب الماركة والبراند"}
                </h2>
                <p className="text-zinc-500 text-sm max-w-xl mx-auto leading-relaxed">
                  {currentLang === "en"
                    ? "Search available products through our trusted global quality partners. Choose a brand you trust for high performance."
                    : "ابحث عن المنتجات المتاحة من خلال شركاء جودتنا العالميين. اختر البراند الذي تثق به للحصول على أداء مذهل ومستدام."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {brands.map((brand) => {
                  const productCount = products.filter(p => p.brand_id === brand.id).length;
                  const localizedBrandName = getBrandName(brand, currentLang);
                  return (
                    <div 
                      key={brand.id}
                      onClick={() => navigateTo({ type: "brand", slug: brand.slug })}
                      className="bg-white border border-zinc-200/80 rounded-2xl p-6 flex flex-col items-center justify-between text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group cursor-pointer relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-zinc-50 rounded-full -mr-8 -mt-8 -z-10 group-hover:scale-125 transition-transform duration-500"></div>
                      
                      <div className="h-24 w-full flex items-center justify-center p-3 mb-4">
                        {brand.logo_url ? (
                          <img 
                            src={brand.logo_url} 
                            alt={localizedBrandName} 
                            className="max-w-full max-h-full object-contain filter group-hover:scale-110 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 font-black text-xl border border-zinc-200">
                            {localizedBrandName.charAt(0)}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 w-full">
                        <h3 className="font-black text-zinc-900 text-base group-hover:text-[#3e499e] transition-colors">
                          {localizedBrandName}
                        </h3>
                        <p className="text-xs text-zinc-500 font-bold">
                          {currentLang === "en"
                            ? (productCount === 0 ? "No products available" : `${productCount} ${productCount === 1 ? "product" : "products"} available`)
                            : (productCount === 0 ? "لا توجد منتجات حالياً" : `${productCount} منتج متاح`)}
                        </p>
                      </div>

                      <div className="mt-5 text-xs text-[#3e499e] font-black flex items-center gap-1 group-hover:gap-2 transition-all">
                        <span>{currentLang === "en" ? "Browse Products" : "تصفح المنتجات"}</span>
                        <span className="rtl:rotate-0 ltr:rotate-180">←</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Industrial Banner Callout */}
            {isMaintenanceEnabled && (
              <section className="bg-zinc-100 border-y border-zinc-200/60 py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="bg-white rounded-2xl border border-zinc-200 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-[#3e499e] text-white p-3.5 rounded-xl hidden sm:block shadow-md">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 text-start">
                        <h3 className="font-extrabold text-zinc-900 text-lg">
                          {getText("home_maint_section_title", currentLang === "en" ? "Genuine Maintenance with Certified Spare Parts" : "صيانة أصلية بقطع غيار معتمدة")}
                        </h3>
                        <p className="text-zinc-500 text-sm leading-relaxed max-w-2xl">
                          {getText("home_maint_section_desc", currentLang === "en" 
                            ? "We don't just sell products; we have a fully equipped maintenance center with modern diagnostic tools and trained engineers to keep your products operating at peak performance." 
                            : "لا نكتفي ببيع المنتجات فحسب، بل لدينا مركز صيانة متكامل مجهز بأحدث أدوات الفحص، مع فريق من المهندسين المدربين لضمان بقاء منتجاتك بأفضل حالة تشغيلية ممكنة وبأقل التكاليف.")}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setView({ type: "maintenance" });
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold px-6 py-3 rounded-xl text-xs transition-colors cursor-pointer shrink-0"
                    >
                      {currentLang === "en" ? "Warranty & Maintenance Details" : "تفاصيل الضمان والصيانة"}
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* 4. Featured Products Section */}
            {isFeaturedEnabled && (
              <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20" id="featured-products-section">
                <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-10 pb-6 border-b border-zinc-200/80">
                  <div className="space-y-2 text-start">
                    <span className="text-xs font-bold text-[#3e499e] uppercase tracking-widest bg-[#3e499e]/10 px-3 py-1 rounded-full">
                      {currentLang === "en" ? "Most Popular & Trusted" : "الأكثر طلباً وموثوقية"}
                    </span>
                    <h2 className="text-3xl font-black text-zinc-900 tracking-tight">
                      {currentLang === "en" ? "Featured Products Recommended for Companies & Stores" : "منتجات مختارة وموصى بها للشركات والمتاجر"}
                    </h2>
                    <p className="text-zinc-500 text-sm max-w-lg leading-relaxed">
                      {currentLang === "en" 
                        ? "A curated selection of our top tools and products tested under the toughest heavy-duty working conditions." 
                        : "مجموعة من أفضل أدوات ومنتجات الشركة المختبرة تحت أقسى ظروف العمل الشاق."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 font-medium">
                      {currentLang === "en" ? "Quick Filter:" : "تصفية سريعة:"}
                    </span>
                    <div className="bg-zinc-100 p-1 rounded-lg border border-zinc-200 flex gap-1">
                      <span className="bg-white text-zinc-900 font-bold px-3 py-1.5 rounded-md text-xs shadow-sm cursor-pointer">
                        {currentLang === "en" ? "All Featured" : "الكل المميز"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {products.filter(p => p.is_featured).map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onSelect={handleProductSelect} 
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 5. WhatsApp Custom Order Banner */}
            <WhatsAppBanner />
          </div>
        )}

        {/* 6. About Us "من نحن" Stateful Page */}
        {view.type === "about" && (
          <div className="py-12 md:py-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
              
              {/* Head line */}
              <div className="text-center space-y-4 mb-12">
                <div className="inline-flex items-center gap-1.5 bg-[#3e499e]/10 border border-[#3e499e]/20 px-3.5 py-1 rounded-full text-[#3e499e] text-xs font-bold">
                  <Building className="w-3.5 h-3.5" />
                  <span>{currentLang === "en" ? "About Company & Core Values" : "عن الشركة وقيمنا الأساسية"}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 leading-tight">
                  {getText("about_hero_title", currentLang === "en" ? `Company ${companyInfo.englishName || companyInfo.name}` : `شركة ${companyInfo.name}`)}
                </h1>
                <p className="text-zinc-500 text-sm max-w-xl mx-auto leading-relaxed">
                  {getText("about_hero_description", currentLang === "en"
                    ? "Founded to deliver advanced solutions and high-quality products for companies, stores, and businesses across Egypt and the Middle East."
                    : "تأسست الشركة لتقديم حلول متطورة ومنتجات عالية الجودة للشركات والمتاجر والأنشطة التجارية في مصر والشرق الأوسط.")}
                </p>
              </div>

              {/* Company Image/Banner */}
              <div className="relative rounded-2xl overflow-hidden shadow-xl border border-zinc-200/80 mb-12 max-h-[380px]">
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent z-10"></div>
                <img
                  src={getText("about_page_image", "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=1200")}
                  alt="Al-Safwa Factory Team"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-6 right-6 rtl:right-6 rtl:left-auto left-6 z-20 text-start">
                  <span className="text-xs text-blue-300 font-extrabold uppercase tracking-widest font-mono">
                    {getText("about_banner_badge", currentLang === "en" ? "Established 2011" : "تأسسنا عام 2011")}
                  </span>
                  <h3 className="text-white text-xl font-black mt-1">
                    {getText("about_banner_text", currentLang === "en" ? "Steadily advancing toward providing the strongest industrial innovations" : "نسير بخطى ثابتة نحو توفير أقوى الابتكارات الصناعية")}
                  </h3>
                </div>
              </div>

              {/* Story Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-start mb-12">
                <div className="space-y-4">
                  <h3 className="font-extrabold text-zinc-900 text-lg border-r-4 rtl:border-r-4 rtl:border-l-0 border-l-4 border-[#3e499e] px-3">
                    {getText("about_mission_title", currentLang === "en" ? "Our Mission" : "رسالتنا")}
                  </h3>
                  <p className="text-zinc-600 text-sm leading-relaxed whitespace-pre-line">
                    {getText("about_mission_desc", currentLang === "en"
                      ? "We always strive to provide high-efficiency products complying with top international standards at competitive prices suited for the local market, backed by professional technical support."
                      : "نسعى دائماً لتوفير منتجات عالية الكفاءة بمواصفات مطابقة لأعلى المعايير العالمية، بأسعار تنافسية تناسب السوق المحلي، مع تقديم دعم فني احترافي لعملائنا لتمكينهم من إنجاز مشاريعهم بأعلى دقة وأمان.")}
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="font-extrabold text-zinc-900 text-lg border-r-4 rtl:border-r-4 rtl:border-l-0 border-l-4 border-[#3e499e] px-3">
                    {getText("about_vision_title", currentLang === "en" ? "Our Vision" : "رؤيتنا")}
                  </h3>
                  <p className="text-zinc-600 text-sm leading-relaxed whitespace-pre-line">
                    {getText("about_vision_desc", currentLang === "en"
                      ? "To be the primary choice and premier dealer for every company, store owner, or trader seeking reliable products with guaranteed quality."
                      : "أن نكون الخيار الأول والوكيل الأبرز لكل صاحب شركة أو متجر أو تاجر يبحث عن المنتجات الموثوقة التي تتميز بالتحمل الفائق والجودة العالية.")}
                  </p>
                </div>
              </div>

              {/* Core Values Bento Layout */}
              <div className="bg-zinc-900 text-zinc-100 rounded-2xl p-6 sm:p-8 border border-zinc-800 space-y-6">
                <h3 className="font-extrabold text-white text-lg text-start">
                  {getText("about_why_choose_us", currentLang === "en" ? `Why Professionals Choose ${companyInfo.englishName || companyInfo.name}?` : `لماذا يختار المحترفون ${companyInfo.name}؟`)}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-start">
                  <div className="space-y-2">
                    <div className="h-10 w-10 bg-[#3e499e]/20 border border-[#3e499e]/40 rounded-lg flex items-center justify-center text-blue-300 font-bold text-sm">
                      {currentLang === "en" ? "1" : "١"}
                    </div>
                    <h4 className="font-bold text-white text-sm">
                      {getText("about_value_1_title", currentLang === "en" ? "Strict Quality" : "الجودة الصارمة")}
                    </h4>
                    <p className="text-zinc-400 text-xs leading-relaxed whitespace-pre-line">
                      {getText("about_value_1_desc", currentLang === "en"
                        ? "We subject all our products to rigorous performance testing to ensure shock resistance and dust/heat tolerance."
                        : "نخضع جميع منتجاتنا لاختبارات أداء قاسية للتأكد من قدرتها على تحمل الصدمات ومقاومة الغبار والحرارة العالية.")}
                    </p>
                  </div>
                  <div className="space-y-2 border-t sm:border-t-0 sm:border-r rtl:sm:border-r rtl:sm:border-l-0 sm:border-l border-zinc-800 pt-4 sm:pt-0 sm:px-6">
                    <div className="h-10 w-10 bg-[#3e499e]/20 border border-[#3e499e]/40 rounded-lg flex items-center justify-center text-blue-300 font-bold text-sm">
                      {currentLang === "en" ? "2" : "٢"}
                    </div>
                    <h4 className="font-bold text-white text-sm">
                      {getText("about_value_2_title", currentLang === "en" ? "After-Sales Support" : "دعم ما بعد البيع")}
                    </h4>
                    <p className="text-zinc-400 text-xs leading-relaxed whitespace-pre-line">
                      {getText("about_value_2_desc", currentLang === "en"
                        ? "Our partnership with you starts after purchase; we guarantee immediate maintenance gear and 100% genuine spare parts."
                        : "شراكتنا معك تبدأ بعد الشراء؛ حيث نضمن توفير عتاد الصيانة الفورية وقطع غيار أصلية بنسبة 100%.")}
                    </p>
                  </div>
                  <div className="space-y-2 border-t sm:border-t-0 sm:border-r rtl:sm:border-r rtl:sm:border-l-0 sm:border-l border-zinc-800 pt-4 sm:pt-0 sm:px-6">
                    <div className="h-10 w-10 bg-[#3e499e]/20 border border-[#3e499e]/40 rounded-lg flex items-center justify-center text-blue-300 font-bold text-sm">
                      {currentLang === "en" ? "3" : "٣"}
                    </div>
                    <h4 className="font-bold text-white text-sm">
                      {getText("about_value_3_title", currentLang === "en" ? "Technological Innovation" : "الابتكار التكنولوجي")}
                    </h4>
                    <p className="text-zinc-400 text-xs leading-relaxed whitespace-pre-line">
                      {getText("about_value_3_desc", currentLang === "en"
                        ? "We focus on offering energy-efficient Brushless motors with constant torque for smooth performance and longer lifespan."
                        : "نهتم بتوفير محركات Brushless الموفرة للطاقة وذات العزم الثابت، لتقديم أداء سلس وعمر أطول للمنتج.")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Back to Home CTA */}
              <div className="text-center pt-8">
                <button
                  onClick={() => {
                    setView({ type: "home" });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold px-6 py-3 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {currentLang === "en" ? "Back to Home & Browse Products" : "العودة للرئيسية وتصفح المنتجات"}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* 7. Contact Us "اتصل بنا" Stateful Page */}
        {view.type === "contact" && (
          <div className="py-12 md:py-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              
              {/* Success Alert Banner (Database simulator status) */}
              {isSuccessAlertOpen && lastSavedRecord && (
                <div className="mb-8 bg-blue-50 border border-blue-200 rounded-2xl p-5 shadow-sm text-start space-y-3 animate-fade-in relative">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#3e499e] text-white p-1 rounded-full">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-blue-950 text-sm sm:text-base">
                        {currentLang === "en" ? "Your request was submitted successfully!" : "تم إرسال طلبك بنجاح وقيده بقاعدة البيانات!"}
                      </h3>
                      <p className="text-blue-800 text-xs">
                        {currentLang === "en" 
                          ? "Database entry successfully saved to contact_requests table." 
                          : "تمت محاكاة الإدخال إلى جدول Supabase contact_requests بنجاح."}
                      </p>
                    </div>
                  </div>
                  
                  {/* Database record inspect schema block */}
                  <div className="bg-zinc-950 text-blue-300 rounded-xl p-3 text-xs font-mono overflow-x-auto space-y-1">
                    <div className="text-zinc-500 text-[10px] border-b border-zinc-800 pb-1 mb-1 font-sans">
                      {currentLang === "en" ? "Database Record Preview (JSON Schema):" : "معاينة السجل المُخزن بالـ Database (JSON Schema):"}
                    </div>
                    <div>{"{"}</div>
                    <div className="pl-4">  "id": <span className="text-blue-300">"{lastSavedRecord.id}"</span>,</div>
                    <div className="pl-4">  "name": <span className="text-blue-300">"{lastSavedRecord.name}"</span>,</div>
                    <div className="pl-4">  "phone": <span className="text-blue-300">"{lastSavedRecord.phone}"</span>,</div>
                    <div className="pl-4">  "message": <span className="text-blue-300">"{lastSavedRecord.message}"</span>,</div>
                    <div className="pl-4">  "created_at": <span className="text-blue-300">"{lastSavedRecord.created_at}"</span></div>
                    <div>{"}"}</div>
                  </div>

                  <button 
                    onClick={() => setIsSuccessAlertOpen(false)}
                    className="absolute top-4 left-4 rtl:left-auto rtl:right-4 text-[#3e499e] hover:text-[#323a7e] font-bold text-xs"
                  >
                    {currentLang === "en" ? "Close Alert [x]" : "إغلاق التنبيه [x]"}
                  </button>
                </div>
              )}

              {/* Title Header */}
              <div className="text-center space-y-3 mb-12">
                <span className="text-xs font-bold text-[#3e499e] uppercase tracking-widest bg-[#3e499e]/10 px-3 py-1 rounded-full">
                  {currentLang === "en" ? "Always Happy to Serve You" : "يسعدنا خدمتك دائماً"}
                </span>
                <h1 className="text-3xl font-black text-zinc-900 tracking-tight sm:text-4xl">
                  {currentLang === "en" ? "Contact Us Directly" : "تواصل معنا مباشرة"}
                </h1>
                <p className="text-zinc-500 text-sm max-w-xl mx-auto leading-relaxed">
                  {currentLang === "en"
                    ? "Fill out the form below to send your message directly, or reach us via our hotline and WhatsApp for immediate response and technical consultation."
                    : "يمكنك ملء الاستمارة بالأسفل لإرسال رسالتك مباشرة، أو الاتصال بالخطوط الساخنة وقنوات الواتساب لسرعة الرد والمشورة الفنية."}
                </p>
              </div>

              {/* Contact Grid Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* 1. Contact Details (5 Cols) */}
                <div className="lg:col-span-5 space-y-6 text-start order-2 lg:order-1">
                  
                  <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-sm space-y-6">
                    <h3 className="font-extrabold text-zinc-900 text-base border-r-4 rtl:border-r-4 rtl:border-l-0 border-l-4 border-[#3e499e] px-3">
                      {currentLang === "en" ? "Contact Info & Showroom" : "معلومات الاتصال وصالة العرض"}
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="bg-[#3e499e]/10 text-[#3e499e] p-2.5 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <span className="block text-xs text-zinc-400 font-semibold">
                            {currentLang === "en" ? "Headquarters & Showroom" : "المقر الرئيسي وصالة العرض"}
                          </span>
                          <span className="text-zinc-800 text-sm leading-relaxed font-semibold">
                            {currentLang === "en" ? "Main Showroom: El-Tayaran St., Nasr City, Cairo, Egypt" : companyInfo.address}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="bg-[#3e499e]/10 text-[#3e499e] p-2.5 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
                          <Phone className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <span className="block text-xs text-zinc-400 font-semibold">
                            {currentLang === "en" ? "Unified Hotline" : "الرقم الموحد للتواصل السريع"}
                          </span>
                          <span className="text-zinc-800 text-sm font-bold font-mono">{companyInfo.phone}</span>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="bg-[#3e499e]/10 text-[#3e499e] p-2.5 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <span className="block text-xs text-zinc-400 font-semibold">
                            {currentLang === "en" ? "Official Orders Email" : "البريد الإلكتروني للطلبات الرسمية"}
                          </span>
                          <span className="text-zinc-800 text-sm font-semibold font-mono">{companyInfo.email}</span>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="bg-[#3e499e]/10 text-[#3e499e] p-2.5 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <span className="block text-xs text-zinc-400 font-semibold">
                            {currentLang === "en" ? "Official Working Hours" : "مواعيد العمل الرسمية"}
                          </span>
                          <span className="text-zinc-800 text-xs font-semibold leading-relaxed">
                            {currentLang === "en" 
                              ? "Saturday to Thursday, from 9:00 AM to 7:00 PM."
                              : "من السبت إلى الخميس، من الساعة 9:00 صباحاً حتى الساعة 7:00 مساءً."}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Speed Link */}
                  <div className="bg-blue-50/70 rounded-2xl p-6 border border-blue-200/60 space-y-4 shadow-inner">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#3e499e] text-white p-2 rounded-xl">
                        <MessageCircle className="w-5 h-5 fill-white text-[#3e499e]" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-blue-950 text-sm">
                          {currentLang === "en" ? "Instant WhatsApp Chat" : "تواصل واتساب بنقرة واحدة"}
                        </h4>
                        <p className="text-blue-800 text-xs">
                          {currentLang === "en" 
                            ? "Fast support for quick inquiries and immediate order placement." 
                            : "خدمة سريعة للرد الفوري على الاستفسارات وتلقي طلبات الشراء."}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsAppContactPickerOpen(true)}
                      className="w-full block text-center bg-[#3e499e] hover:bg-[#323a7e] text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      {currentLang === "en" ? "Request Assistance & Direct Contact" : "طلب المساعدة والتواصل المباشر"}
                    </button>
                  </div>

                </div>

                {/* 2. Interactive Contact Form (7 Cols) */}
                <div className="lg:col-span-7 order-1 lg:order-2">
                  <div className="bg-white rounded-2xl p-6 sm:p-8 border border-zinc-200/80 shadow-sm text-start space-y-6">
                    <h3 className="font-extrabold text-zinc-900 text-lg border-r-4 rtl:border-r-4 rtl:border-l-0 border-l-4 border-[#3e499e] px-3">
                      {currentLang === "en" ? "Send Us a Message" : "إرسال رسالة مباشرة لقاعدة البيانات"}
                    </h3>

                    <form onSubmit={handleContactSubmit} className="space-y-5">
                      {/* Honeypot field for spam prevention */}
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

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-zinc-600">
                          {currentLang === "en" ? "Full Name *" : "الاسم الكامل *"}
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={currentLang === "en" ? "e.g. Eng. Ahmed Mohamed" : "مثال: المهندس أحمد محمد"}
                          className="w-full bg-zinc-50 border border-zinc-200/80 rounded-xl px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#3e499e] focus:bg-white transition-all text-start"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-zinc-600">
                          {currentLang === "en" ? "Phone Number (WhatsApp) *" : "رقم الهاتف (الواتساب) *"}
                        </label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder={currentLang === "en" ? "e.g. +20 100 123 4567" : "مثال: +20 100 123 4567"}
                          className="w-full bg-zinc-50 border border-zinc-200/80 rounded-xl px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#3e499e] focus:bg-white transition-all text-start font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-zinc-600">
                          {currentLang === "en" ? "Message or Item Code *" : "الرسالة أو كود المنتج المطلوب *"}
                        </label>
                        <textarea
                          required
                          rows={4}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder={currentLang === "en" ? "Type your message, inquiry, or requested item code and specifications..." : "اكتب رسالتك، استفسارك، أو كود المنتج المطلوب ومقاساته..."}
                          className="w-full bg-zinc-50 border border-zinc-200/80 rounded-xl px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#3e499e] focus:bg-white transition-all text-start"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#3e499e] hover:bg-[#323a7e] text-white font-bold py-3.5 rounded-xl text-sm shadow-lg shadow-[#3e499e]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Send className="w-4 h-4 shrink-0" />
                        <span>{currentLang === "en" ? "Send Request" : "إرسال الطلب"}</span>
                      </button>
                    </form>
                  </div>
                </div>

              </div>
              
              {/* LocalStorage request history table logger for visual demonstration */}
              {submittedRequests.length > 0 && (
                <div className="mt-12 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-zinc-300 text-start space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
                    <h3 className="font-extrabold text-white text-sm">
                      {currentLang === "en" ? "Locally Saved Messages (contact_requests table)" : "سجل الرسائل المرسلة محلياً (جدول contact_requests)"}
                    </h3>
                    <button 
                      onClick={() => {
                        localStorage.removeItem("electrocore_contact_requests");
                        setSubmittedRequests([]);
                      }}
                      className="text-xs text-red-400 hover:text-red-300 font-bold"
                    >
                      {currentLang === "en" ? "Clear Log [x]" : "حذف السجل بالكامل [x]"}
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-start border-collapse">
                      <thead>
                        <tr className="text-zinc-500 border-b border-zinc-800">
                          <th className="py-2.5 font-bold">{currentLang === "en" ? "Request ID" : "معرف الطلب (UUID)"}</th>
                          <th className="py-2.5 font-bold">{currentLang === "en" ? "Name" : "الاسم"}</th>
                          <th className="py-2.5 font-bold">{currentLang === "en" ? "Phone" : "رقم الهاتف"}</th>
                          <th className="py-2.5 font-bold">{currentLang === "en" ? "Message" : "نص الرسالة"}</th>
                          <th className="py-2.5 font-bold">{currentLang === "en" ? "Date" : "تاريخ الإدخال"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {submittedRequests.map((req) => (
                          <tr key={req.id} className="hover:bg-zinc-850/50">
                            <td className="py-3 font-mono text-zinc-500 text-[10px]">{req.id.substring(0, 8)}...</td>
                            <td className="py-3 font-semibold text-zinc-200">{req.name}</td>
                            <td className="py-3 font-mono text-zinc-400">{req.phone}</td>
                            <td className="py-3 max-w-xs truncate text-zinc-400">{req.message}</td>
                            <td className="py-3 font-mono text-zinc-500 text-[10px]">{new Date(req.created_at).toLocaleString(currentLang === "en" ? "en-US" : "ar-EG")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Favorites Page */}
        {view.type === "favorites" && (
          <FavoritesPage 
            onNavigateToHome={() => navigateTo({ type: "home" })}
            onSelectProduct={handleProductSelect}
          />
        )}

        {/* Maintenance & Warranty Page */}
        {view.type === "maintenance" && (
          isMaintenanceEnabled ? (
            <MaintenancePage 
              onNavigateToHome={() => navigateTo({ type: "home" })}
            />
          ) : (
            <div className="py-24 text-center text-zinc-800 font-bold max-w-xl mx-auto px-4 space-y-5 flex flex-col items-center justify-center min-h-[50vh]" dir="rtl">
              <div className="bg-[#3e499e]/10 text-[#3e499e] p-4 rounded-full">
                <ShieldCheck className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-black text-zinc-900">هذه الميزة غير متاحة حالياً</h2>
              <p className="text-zinc-500 text-sm leading-relaxed max-w-md">
                عذرًا، ميزة الصيانة والضمان المعتمد غير مفعّلة في الموقع حالياً. يرجى التواصل معنا مباشرة للاستفسارات العاجلة.
              </p>
              <button
                onClick={() => navigateTo({ type: "home" })}
                className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-850 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer"
              >
                العودة للصفحة الرئيسية
              </button>
            </div>
          )
        )}

        {/* Featured Products Page View */}
        {view.type === "featured" && (
          isFeaturedEnabled ? (
            <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8" dir="rtl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-zinc-200">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#3e499e] uppercase tracking-widest bg-[#3e499e]/10 px-3 py-1 rounded-full">
                    الأكثر طلباً وموثوقية
                  </span>
                  <h1 className="text-3xl font-black text-zinc-900 tracking-tight sm:text-4xl">
                    المنتجات المميزة
                  </h1>
                  <p className="text-zinc-500 text-sm max-w-xl leading-relaxed">
                    {currentLang === "en" ? "Browse our list of featured products recommended for companies & stores with verified warranty." : "تصفح قائمة المنتجات المميزة والموصى بها للشركات والمتاجر بضمان معتمد."}
                  </p>
                </div>
                <button
                  onClick={() => navigateTo({ type: "home" })}
                  className="inline-flex items-center gap-1.5 text-xs text-[#3e499e] font-bold hover:underline cursor-pointer"
                >
                  العودة للرئيسية ←
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.filter(p => p.is_featured).map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onSelect={handleProductSelect} 
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-zinc-800 font-bold max-w-xl mx-auto px-4 space-y-5 flex flex-col items-center justify-center min-h-[50vh]" dir="rtl">
              <div className="bg-[#3e499e]/10 text-[#3e499e] p-4 rounded-full">
                <Sparkles className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-black text-zinc-900">هذه الصفحة غير متاحة حالياً</h2>
              <p className="text-zinc-500 text-sm leading-relaxed max-w-md">
                عذرًا، قسم المنتجات المميزة غير مفعّل في الموقع حالياً. يرجى تصفح باقي أجزاء الكتالوج أو التواصل معنا للمساعدة.
              </p>
              <button
                onClick={() => navigateTo({ type: "home" })}
                className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-850 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer"
              >
                العودة للصفحة الرئيسية
              </button>
            </div>
          )
        )}

        {/* Brands Page View */}
        {view.type === "brands" && (
          isBrandsEnabled ? (
            <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8" dir="rtl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-zinc-200">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#3e499e] uppercase tracking-widest bg-[#3e499e]/10 px-3 py-1 rounded-full">
                    {currentLang === "en" ? "Authorized Partners" : "شركاء النجاح"}
                  </span>
                  <h1 className="text-3xl font-black text-zinc-900 tracking-tight sm:text-4xl">
                    {currentLang === "en" ? "Certified Brands" : "العلامات التجارية المعتمدة"}
                  </h1>
                  <p className="text-zinc-500 text-sm max-w-xl leading-relaxed">
                    {currentLang === "en"
                      ? "Choose your preferred brand to browse its products and tools."
                      : "اختر البراند المفضل لديك لتصفح المنتجات والأدوات الخاصة به."}
                  </p>
                </div>
                <button
                  onClick={() => navigateTo({ type: "home" })}
                  className="inline-flex items-center gap-1.5 text-xs text-[#3e499e] font-bold hover:underline cursor-pointer"
                >
                  <span>{currentLang === "en" ? "Back to Home" : "العودة للرئيسية"}</span>
                  <span className="rtl:rotate-0 ltr:rotate-180">←</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {brands.map((brand) => {
                  const productCount = products.filter(p => p.brand_id === brand.id).length;
                  const localizedBrandName = getBrandName(brand, currentLang);
                  return (
                    <div 
                      key={brand.id}
                      onClick={() => navigateTo({ type: "brand", slug: brand.slug })}
                      className="bg-white border border-zinc-200/80 rounded-2xl p-6 flex flex-col items-center justify-between text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group cursor-pointer relative overflow-hidden"
                    >
                      <div className="h-24 w-full flex items-center justify-center p-3 mb-4">
                        {brand.logo_url ? (
                          <img 
                            src={brand.logo_url} 
                            alt={localizedBrandName} 
                            className="max-w-full max-h-full object-contain filter group-hover:scale-110 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 font-black text-xl border border-zinc-200">
                            {localizedBrandName.charAt(0)}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 w-full">
                        <h3 className="font-black text-zinc-900 text-base group-hover:text-[#3e499e] transition-colors">
                          {localizedBrandName}
                        </h3>
                        <p className="text-xs text-zinc-500 font-bold">
                          {currentLang === "en"
                            ? (productCount === 0 ? "No products available" : `${productCount} ${productCount === 1 ? "product" : "products"} available`)
                            : (productCount === 0 ? "لا توجد منتجات حالياً" : `${productCount} منتج متاح`)}
                        </p>
                      </div>

                      <div className="mt-5 text-xs text-[#3e499e] font-black flex items-center gap-1 group-hover:gap-2 transition-all">
                        <span>{currentLang === "en" ? "Browse Products" : "تصفح المنتجات"}</span>
                        <span className="rtl:rotate-0 ltr:rotate-180">←</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-zinc-800 font-bold max-w-xl mx-auto px-4 space-y-5 flex flex-col items-center justify-center min-h-[50vh]" dir="rtl">
              <div className="bg-[#3e499e]/10 text-[#3e499e] p-4 rounded-full">
                <Award className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-black text-zinc-900">هذه الصفحة غير متاحة حالياً</h2>
              <p className="text-zinc-500 text-sm leading-relaxed max-w-md">
                عذرًا، قسم العلامات التجارية غير مفعّل في الموقع حالياً. يرجى تصفح أجزاء الكتالوج الأخرى.
              </p>
              <button
                onClick={() => navigateTo({ type: "home" })}
                className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-850 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer"
              >
                العودة للصفحة الرئيسية
              </button>
            </div>
          )
        )}

        {/* Category Page */}
        {view.type === "category" && (() => {
          const cat = categories.find(c => c.slug === view.slug);
          return cat ? (
            <CategoryPage 
              category={cat}
              products={products}
              onNavigateToHome={() => navigateTo({ type: "home" })}
              onSelectProduct={handleProductSelect}
            />
          ) : (
            <div className="py-24 text-center text-zinc-500 font-bold" dir="rtl">القسم المطلوب غير موجود حالياً.</div>
          );
        })()}

        {/* Brand Page */}
        {view.type === "brand" && (() => {
          const brandObj = brands.find(b => b.slug === view.slug);
          return brandObj ? (
            <BrandPage 
              brand={brandObj}
              categories={categories}
              products={products}
              onNavigateToHome={() => navigateTo({ type: "home" })}
              onSelectProduct={handleProductSelect}
            />
          ) : (
            <div className="py-24 text-center text-zinc-500 font-bold" dir="rtl">العلامة التجارية المطلوبة غير موجودة حالياً.</div>
          );
        })()}

        {/* Product Details Page */}
        {view.type === "product" && (() => {
          const prod = products.find(p => p.slug === view.slug);
          return prod ? (
            <ProductDetailPage 
              product={prod}
              categories={categories}
              products={products}
              onNavigateToHome={() => navigateTo({ type: "home" })}
              onNavigateToCategory={handleCategorySelect}
              onSelectProduct={handleProductSelect}
            />
          ) : (
            <div className="py-24 text-center text-zinc-500 font-bold" dir="rtl">المنتج المطلوب غير موجود حالياً.</div>
          );
        })()}

        {/* Admin Views */}
        {view.type === "admin-login" && (
          <AdminLogin 
            onLoginSuccess={(sess) => {
              setSession(sess);
              navigateTo({ type: "admin-dashboard" });
            }}
            onNavigateToHome={() => navigateTo({ type: "home" })}
          />
        )}

        {isAdminPath && view.type !== "admin-login" && (
          <div className="flex flex-col md:flex-row min-h-screen bg-zinc-950 text-white" dir="rtl">
            <AdminSidebar 
              currentView={view.type}
              onNavigate={(viewType) => navigateTo({ type: viewType as any })}
              onLogout={() => {
                const supabase = getSupabase();
                if (supabase) {
                  supabase.auth.signOut();
                }
                setSession(null);
                navigateTo({ type: "admin-login" });
              }}
              onNavigateToHome={() => navigateTo({ type: "home" })}
              userEmail={session?.user?.email}
            />
            <div className="flex-1 min-h-screen bg-zinc-950">
              {view.type === "admin-dashboard" && (
                <AdminDashboard 
                  session={session}
                  onLogout={() => {
                    const supabase = getSupabase();
                    if (supabase) {
                      supabase.auth.signOut();
                    }
                    setSession(null);
                    navigateTo({ type: "admin-login" });
                  }}
                  onNavigateToHome={() => navigateTo({ type: "home" })}
                  onNavigateToCategories={() => navigateTo({ type: "admin-categories" })}
                  onNavigateToProducts={() => navigateTo({ type: "admin-products" })}
                  onNavigateToMaintenanceRequests={() => navigateTo({ type: "admin-maintenance" })}
                  onNavigateToContactRequests={() => navigateTo({ type: "admin-contact" })}
                  onNavigateToContent={() => navigateTo({ type: "admin-content" })}
                  onNavigateToBrands={() => navigateTo({ type: "admin-brands" })}
                  categoriesCount={categories.length}
                  productsCount={products.length}
                  brandsCount={brands.length}
                />
              )}

              {view.type === "admin-categories" && (
                <AdminCategories 
                  categories={categories}
                  products={products}
                  onRefresh={handleRefresh}
                  onNavigateToDashboard={() => navigateTo({ type: "admin-dashboard" })}
                />
              )}

              {view.type === "admin-products" && (
                <AdminProducts 
                  products={products}
                  categories={categories}
                  brands={brands}
                  onRefresh={handleRefresh}
                  onNavigateToDashboard={() => navigateTo({ type: "admin-dashboard" })}
                />
              )}

              {view.type === "admin-maintenance" && (
                <AdminMaintenanceRequests 
                  onNavigateToDashboard={() => navigateTo({ type: "admin-dashboard" })}
                />
              )}

              {view.type === "admin-contact" && (
                <AdminContactRequests 
                  onNavigateToDashboard={() => navigateTo({ type: "admin-dashboard" })}
                />
              )}

              {view.type === "admin-content" && (
                <AdminContent 
                  onBackToDashboard={() => navigateTo({ type: "admin-dashboard" })}
                />
              )}

              {view.type === "admin-brands" && (
                <AdminBrands 
                  onNavigateToDashboard={() => navigateTo({ type: "admin-dashboard" })}
                  onRefresh={handleRefresh}
                />
              )}

              {view.type === "admin-settings" && (
                <AdminSettings />
              )}
            </div>
          </div>
        )}
      </main>

      {/* 8. Footer */}
      {!isAdminPath && (
        <Footer 
          categories={categories}
          onNavigateToHome={() => navigateTo({ type: "home" })}
          onNavigateToAbout={() => navigateTo({ type: "about" })}
          onNavigateToContact={() => navigateTo({ type: "contact" })}
          onNavigateToMaintenance={() => navigateTo({ type: "maintenance" })}
          onCategorySelect={handleCategorySelect}
        />
      )}

      <ContactMethodPicker 
        isOpen={isAppContactPickerOpen}
        onClose={() => setIsAppContactPickerOpen(false)}
        title="مساعدة فنية واختيار منتج"
        subtitle="اختر القناة المفضلة لديك للتواصل مباشرة مع مهندسي الدعم الفني للصفوة"
        customMessage="مرحباً الصفوة، أود طلب المساعدة الفنية بخصوص اختيار منتج أو طلب عروض أسعار."
        customSubject="طلب مساعدة فنية من صفحة اتصل بنا"
      />
    </div>
  );
}
