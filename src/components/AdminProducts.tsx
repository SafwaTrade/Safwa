import React, { useState, useMemo, useEffect, ChangeEvent } from "react";
import { Product, Category, Brand } from "../types";
import { getSupabase } from "../lib/supabase";
import { useSiteContent } from "../context/SiteContentContext";

const generateUUID = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x03) | 0x08;
    return v.toString(16);
  });
};
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  Check, 
  Search, 
  Filter, 
  PlusCircle, 
  MinusCircle, 
  ArrowUp, 
  ArrowDown, 
  Boxes,
  Sparkles,
  DollarSign,
  Globe
} from "lucide-react";

interface AdminProductsProps {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  onRefresh: () => void;
  onNavigateToDashboard: () => void;
}

interface SpecItem {
  key: string;
  value: string;
  key_en?: string;
  value_en?: string;
}

interface FeatureItem {
  ar: string;
  en: string;
}

export default function AdminProducts({
  products,
  categories,
  brands = [],
  onRefresh,
  onNavigateToDashboard,
}: AdminProductsProps) {
  const { getText } = useSiteContent();
  const isAiTranslationEnabled = getText("ai_translation_suggestion_enabled", "false") === "true";

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState("");
  const [selectedAvailabilityFilter, setSelectedAvailabilityFilter] = useState("");

  // Form Fields
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [shortDescriptionEn, setShortDescriptionEn] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [fullDescriptionEn, setFullDescriptionEn] = useState("");
  const [price, setPrice] = useState<string>("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  
  // Dynamic Specs Builder state
  const [specs, setSpecs] = useState<SpecItem[]>([{ key: "", value: "", key_en: "", value_en: "" }]);

  // Product Gallery state (Array of image URLs)
  const [gallery, setGallery] = useState<string[]>([]);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [translatingField, setTranslatingField] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // External Translation API helper (ONLY invoked if AI translation is enabled and button clicked)
  const translateText = async (text: string): Promise<string> => {
    if (!text || !text.trim()) return "";
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodeURIComponent(text.trim())}`);
      const data = await res.json();
      if (data && data[0] && Array.isArray(data[0])) {
        return data[0].map((item: any) => item[0]).join("");
      }
    } catch (err) {
      console.warn("Translation failed:", err);
    }
    return "";
  };

  const handleTranslateField = async (text: string, setter: (val: string) => void, fieldId: string) => {
    if (!text || !text.trim()) return;
    setTranslatingField(fieldId);
    const translated = await translateText(text);
    if (translated) {
      setter(translated);
    }
    setTranslatingField(null);
  };

  // Delete product state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Filtered Products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.short_description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategoryFilter ? p.category_id === selectedCategoryFilter : true;
      const matchesBrand = selectedBrandFilter ? p.brand_id === selectedBrandFilter : true;
      
      let matchesAvailability = true;
      if (selectedAvailabilityFilter === "available") {
        matchesAvailability = p.is_available !== false;
      } else if (selectedAvailabilityFilter === "unavailable") {
        matchesAvailability = p.is_available === false;
      }

      return matchesSearch && matchesCategory && matchesBrand && matchesAvailability;
    });
  }, [products, searchQuery, selectedCategoryFilter, selectedBrandFilter, selectedAvailabilityFilter]);

  // Transliterate to generate slug
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\u0600-\u06FF\w\s-]/g, "") 
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-");
  };

  // Specs helpers
  const handleAddSpec = () => {
    setSpecs([...specs, { key: "", value: "" }]);
  };

  const handleRemoveSpec = (index: number) => {
    const updated = specs.filter((_, i) => i !== index);
    setSpecs(updated.length > 0 ? updated : [{ key: "", value: "" }]);
  };

  const handleSpecChange = (index: number, field: "key" | "value", val: string) => {
    const updated = specs.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: val };
      }
      return item;
    });
    setSpecs(updated);
  };

  // Gallery helpers
  const handleMoveImage = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === gallery.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...gallery];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setGallery(updated);
  };

  const handleRemoveImage = (index: number) => {
    setGallery(gallery.filter((_, i) => i !== index));
  };

  // Upload gallery image directly to Supabase Storage
  const handleGalleryUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const supabase = getSupabase();
    
    // Process files one by one
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (supabase) {
        try {
          const fileExt = file.name.split(".").pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}.${fileExt}`;
          const filePath = `products/${fileName}`;

          // Upload to "products" bucket
          let { data, error } = await supabase.storage
            .from("products")
            .upload(filePath, file, { cacheControl: "3600", upsert: true });

          if (error) {
            const secondary = await supabase.storage
              .from("images")
              .upload(filePath, file, { cacheControl: "3600", upsert: true });
            
            if (secondary.error) throw secondary.error;
            data = secondary.data;
          }

          const bucketName = error ? "images" : "products";
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

          setGallery(prev => [...prev, urlData.publicUrl]);
          setSuccessMsg("تم رفع الصورة وإضافتها للمعرض بنجاح!");
        } catch (err: any) {
          console.error("Gallery upload error:", err);
          // base64 fallback
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === "string") {
              setGallery(prev => [...prev, reader.result as string]);
              setSuccessMsg("تم حفظ الصورة محلياً (Base64) بنجاح للتجربة!");
            }
          };
          reader.readAsDataURL(file);
        }
      } else {
        // base64 read for local testing
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            setGallery(prev => [...prev, reader.result as string]);
            setSuccessMsg("تم حفظ الصورة محلياً (Base64) للتجربة!");
          }
        };
        reader.readAsDataURL(file);
      }
    }
    setUploading(false);
  };

  // Open Form for Add
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName("");
    setNameEn("");
    setCategoryId(categories[0]?.id || "");
    setBrandId("");
    setShortDescription("");
    setShortDescriptionEn("");
    setFullDescription("");
    setFullDescriptionEn("");
    setPrice("");
    setIsFeatured(false);
    setIsAvailable(true);
    setSpecs([{ key: "", value: "", key_en: "", value_en: "" }]);
    setFeatures([]);
    setGallery([]);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setNameEn(prod.name_en || "");
    setCategoryId(prod.category_id);
    setBrandId(prod.brand_id || "");
    setShortDescription(prod.short_description);
    setShortDescriptionEn(prod.short_description_en || "");
    setFullDescription(prod.full_description);
    setFullDescriptionEn(prod.full_description_en || "");
    setPrice(prod.price ? String(prod.price) : "");
    setIsFeatured(prod.is_featured);
    setIsAvailable(prod.is_available !== false);

    // Map features
    const arFeats = prod.features || [];
    const enFeats = prod.features_en || [];
    const maxFeatLen = Math.max(arFeats.length, enFeats.length);
    const featureItems: FeatureItem[] = [];
    for (let i = 0; i < maxFeatLen; i++) {
      featureItems.push({
        ar: arFeats[i] || "",
        en: enFeats[i] || ""
      });
    }
    setFeatures(featureItems);
    
    // Parse specs object into spec array
    const arSpecs = prod.specs || {};
    const enSpecs = prod.specs_en || {};
    const arEntries = Object.entries(arSpecs);
    const enEntries = Object.entries(enSpecs);
    const parsedSpecs: SpecItem[] = [];

    arEntries.forEach(([key, value], idx) => {
      const enPair = enEntries[idx];
      parsedSpecs.push({
        key,
        value: String(value),
        key_en: enPair ? enPair[0] : (enSpecs[key] ? key : ""),
        value_en: enPair ? String(enPair[1]) : String(enSpecs[key] || "")
      });
    });

    if (enEntries.length > arEntries.length) {
      for (let i = arEntries.length; i < enEntries.length; i++) {
        const [kEn, vEn] = enEntries[i];
        parsedSpecs.push({
          key: "",
          value: "",
          key_en: kEn,
          value_en: String(vEn)
        });
      }
    }

    setSpecs(parsedSpecs.length > 0 ? parsedSpecs : [{ key: "", value: "", key_en: "", value_en: "" }]);
    
    // Load images
    setGallery(prod.images || []);
    
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsFormOpen(true);
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId || !shortDescription || !fullDescription) {
      setErrorMsg("الرجاء ملء كافة الحقول الأساسية المطلوبة.");
      return;
    }

    if (gallery.length === 0) {
      setErrorMsg("الرجاء رفع صورة واحدة على الأقل لمنتجك.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Convert specs array to Objects
    const specsObject: Record<string, string> = {};
    const specsEnObject: Record<string, string> = {};
    specs.forEach(item => {
      const kAr = item.key.trim();
      const vAr = item.value.trim();
      const kEn = (item.key_en || item.key).trim();
      const vEn = (item.value_en || "").trim();

      if (kAr && vAr) {
        specsObject[kAr] = vAr;
      }
      if (kEn && vEn) {
        specsEnObject[kEn] = vEn;
      } else if (kAr && vEn) {
        specsEnObject[kAr] = vEn;
      }
    });

    const arFeatures = features.map(f => f.ar.trim()).filter(Boolean);
    const enFeatures = features.map(f => f.en.trim()).filter(Boolean);

    const finalId = editingProduct ? editingProduct.id : generateUUID();
    const finalSlug = generateSlug(name);

    // Always preserve local translation cache so translations are immediately usable locally
    try {
      const localTransStr = localStorage.getItem("safwa_local_product_translations") || "{}";
      const localTrans = JSON.parse(localTransStr);
      localTrans[finalId] = {
        name_en: nameEn.trim() || undefined,
        short_description_en: shortDescriptionEn.trim() || undefined,
        full_description_en: fullDescriptionEn.trim() || undefined,
        specs_en: Object.keys(specsEnObject).length > 0 ? specsEnObject : undefined,
        features_en: enFeatures.length > 0 ? enFeatures : undefined,
      };
      localStorage.setItem("safwa_local_product_translations", JSON.stringify(localTrans));
    } catch (errCache) {
      console.warn("Failed to write translation cache to localStorage:", errCache);
    }

    const productData = {
      category_id: categoryId,
      brand_id: brandId || null,
      name,
      name_en: nameEn.trim() || null,
      slug: finalSlug,
      short_description: shortDescription,
      short_description_en: shortDescriptionEn.trim() || null,
      full_description: fullDescription,
      full_description_en: fullDescriptionEn.trim() || null,
      specs: specsObject,
      specs_en: Object.keys(specsEnObject).length > 0 ? specsEnObject : {},
      price: price ? parseFloat(price) : null,
      is_featured: isFeatured,
      is_available: isAvailable,
      features: arFeatures,
      features_en: enFeatures,
    };

    const supabase = getSupabase();

    try {
      if (supabase) {
        let error;
        console.log("Attempting to save product data to Supabase...", productData);
        
        let exists = false;
        if (editingProduct) {
          try {
            const { data: existData } = await supabase
              .from("products")
              .select("id")
              .eq("id", editingProduct.id)
              .limit(1);
            if (existData && existData.length > 0) {
              exists = true;
            }
          } catch (e) {
            console.warn("Could not check product existence:", e);
          }
        }

        if (editingProduct && exists) {
          const { error: err } = await supabase
            .from("products")
            .update(productData)
            .eq("id", editingProduct.id);
          error = err;
        } else {
          const { error: err } = await supabase
            .from("products")
            .insert([{ id: finalId, ...productData }]);
          error = err;
        }

        // Diagnostic Column/RLS Error Interceptor & Fallback
        if (error) {
          const errMsg = error.message || "";
          console.warn("Primary database write failed:", error);

          const isUuidError = errMsg.includes("uuid") || error.code === "22P02";
          const isFkeyError = errMsg.includes("foreign key") || error.code === "23503";
          const isMissingCol = errMsg.includes("is_available") || errMsg.includes("features") || errMsg.includes("brand_id") || errMsg.includes("name_en") || errMsg.includes("specs_en") || errMsg.includes("column") || error.code === "42703";

          if (isMissingCol || isUuidError || isFkeyError) {
            console.log("Detected missing column or constraint issue. Retrying write with a safe fallback...");
            const fallbackProductData: any = { ...productData };
            
            if (errMsg.includes("features") || errMsg.includes("features_en")) {
              delete fallbackProductData.features;
              delete fallbackProductData.features_en;
            }
            if (errMsg.includes("is_available")) {
              delete fallbackProductData.is_available;
            }
            if (errMsg.includes("brand_id") || isUuidError || isFkeyError) {
              delete fallbackProductData.brand_id;
            }
            if (errMsg.includes("name_en") || errMsg.includes("specs_en") || errMsg.includes("short_description_en") || errMsg.includes("full_description_en") || error.code === "42703") {
              delete fallbackProductData.name_en;
              delete fallbackProductData.short_description_en;
              delete fallbackProductData.full_description_en;
              delete fallbackProductData.specs_en;
              delete fallbackProductData.features_en;
            }
            
            // Safety measure: if code 42703 is present but no specific column matches,
            // remove features and is_available as legacy table fallbacks.
            if ((error.code === "42703" || errMsg.includes("42703")) && !errMsg.includes("features") && !errMsg.includes("is_available") && !errMsg.includes("brand_id")) {
              delete fallbackProductData.features;
              delete fallbackProductData.features_en;
              delete fallbackProductData.is_available;
              delete fallbackProductData.name_en;
              delete fallbackProductData.short_description_en;
              delete fallbackProductData.full_description_en;
              delete fallbackProductData.specs_en;
            }
            
            let retryError;
            if (editingProduct && exists) {
              const { error: retryErr } = await supabase
                .from("products")
                .update(fallbackProductData)
                .eq("id", editingProduct.id);
              retryError = retryErr;
            } else {
              const { error: retryErr } = await supabase
                .from("products")
                .insert([{ id: finalId, ...fallbackProductData }]);
              retryError = retryErr;
            }

            if (!retryError) {
              console.log("Fallback product write succeeded!");
              error = null;
              setSuccessMsg("تم حفظ المنتج بنجاح! (تنبيه: تم الحفظ بدون بعض الأعمدة الإضافية لعدم توفرها في جدول قاعدة البيانات حالياً، يرجى تشغيل كود SQL لتحديث الجدول بالكامل).");
            } else {
              error = retryError;
            }
          }
        }

        if (error) throw error;

        // Save Gallery Images (Delete old, Insert new)
        const { error: deleteImgsError } = await supabase
          .from("product_images")
          .delete()
          .eq("product_id", finalId);

        if (deleteImgsError) {
          console.error("Gallery delete error:", deleteImgsError);
          throw new Error(`فشل تحديث المعرض القديم: ${deleteImgsError.message}`);
        }

        // Insert new images
        if (gallery.length > 0) {
          const galleryInserts = gallery.map((url, index) => ({
            product_id: finalId,
            image_url: url,
            sort_order: index
          }));

          const { error: insertImgsError } = await supabase
            .from("product_images")
            .insert(galleryInserts);

          if (insertImgsError) {
            console.error("Gallery insert error:", insertImgsError);
            throw new Error(`فشل رفع صور المعرض الجديد: ${insertImgsError.message}`);
          }
        }

        if (!successMsg) {
          setSuccessMsg(editingProduct ? "تم حفظ التعديلات بنجاح!" : "تم إضافة المنتج بنجاح للكتالوج!");
        }

        setTimeout(() => {
          setIsFormOpen(false);
          onRefresh();
        }, 800);
      } else {
        throw new Error("فشل الاتصال بقاعدة البيانات. يرجى تهيئة Supabase أولاً لحفظ المنتجات.");
      }
    } catch (err: any) {
      console.error("Database save exception caught:", err);
      let localizedError = err.message || JSON.stringify(err);
      
      if (localizedError.includes("row-level security") || localizedError.includes("violates row-level security policy")) {
        localizedError = "فشل الحفظ بسبب سياسات الحماية RLS في Supabase. يرجى تفعيل سياسة السماح بالإدخال والتعديل (INSERT / UPDATE) للمستخدمين.";
      }
      
      setErrorMsg(`خطأ في الحفظ بقاعدة البيانات: ${localizedError}. لم يتم إغلاق الفورم لتتمكن من مراجعة المدخلات.`);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete product action
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    setSubmitting(true);
    setErrorMsg(null);

    const supabase = getSupabase();

    try {
      if (supabase) {
        const { error } = await supabase
          .from("products")
          .delete()
          .eq("id", productToDelete.id);

        if (error) throw error;
      } else {
        throw new Error("لا يوجد اتصال بـ Supabase للقيام بعملية الحذف.");
      }

      setSuccessMsg("تم حذف المنتج بنجاح!");
      setTimeout(() => {
        setProductToDelete(null);
        onRefresh();
      }, 800);
    } catch (err: any) {
      console.error("Error deleting product:", err);
      setErrorMsg(`تعذر حذف المنتج: ${err.message}`);
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-zinc-950 min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-right text-white" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToDashboard}
              className="bg-zinc-900 hover:bg-zinc-850 p-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-black">إدارة المنتجات والكتالوج</h1>
              <p className="text-zinc-400 text-xs">تعديل وإضافة مواصفات المنتجات وصور المعارض والأسعار</p>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 bg-[#3e499e] hover:bg-[#323a7e] text-white px-4 py-2.5 rounded-xl text-xs font-black transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة منتج جديد</span>
          </button>
        </div>

        {/* Filter & Search Controls */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Search box */}
          <div className="relative w-full md:max-w-md">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن منتج باسمه أو وصفه..."
              className="block w-full pr-10 pl-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#3e499e] transition-colors"
            />
          </div>

          {/* Filters Group */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Category Filter dropdown */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-zinc-400 shrink-0" />
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#3e499e] min-w-[160px] w-full sm:w-auto cursor-pointer"
              >
                <option value="">جميع الأقسام الكلية</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}{cat.name_en ? ` (${cat.name_en})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Filter dropdown */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-zinc-400 shrink-0" />
              <select
                value={selectedBrandFilter}
                onChange={(e) => setSelectedBrandFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#3e499e] min-w-[160px] w-full sm:w-auto cursor-pointer"
              >
                <option value="">جميع العلامات التجارية</option>
                {brands.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}{b.name_en ? ` (${b.name_en})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Availability Filter dropdown */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-zinc-400 shrink-0" />
              <select
                value={selectedAvailabilityFilter}
                onChange={(e) => setSelectedAvailabilityFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#3e499e] min-w-[160px] w-full sm:w-auto cursor-pointer"
              >
                <option value="">كل حالات التوفر</option>
                <option value="available">متوفر فقط</option>
                <option value="unavailable">غير متوفر فقط</option>
              </select>
            </div>
          </div>

        </div>

        {/* Products Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right border-collapse">
              <thead>
                <tr className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 text-xs font-bold uppercase">
                  <th className="px-6 py-4">الصورة الرئيسية</th>
                  <th className="px-6 py-4">اسم المنتج</th>
                  <th className="px-6 py-4">القسم التابع له</th>
                  <th className="px-6 py-4">العلامة التجارية</th>
                  <th className="px-6 py-4">السعر</th>
                  <th className="px-6 py-4 text-center">مميز (Featured)</th>
                  <th className="px-6 py-4 text-center">التوفر</th>
                  <th className="px-6 py-4">تاريخ الإضافة</th>
                  <th className="px-6 py-4 text-left">التحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-zinc-500">
                      <Boxes className="w-8 h-8 mx-auto text-zinc-600 mb-2.5" />
                      <p className="text-xs">لم نعثر على أي منتجات تطابق خيارات البحث والفلترة حالياً.</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((prod) => {
                    const cat = categories.find(c => c.id === prod.category_id);
                    const brand = brands.find(b => b.id === prod.brand_id);
                    return (
                      <tr key={prod.id} className="hover:bg-zinc-900/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img 
                            src={prod.images?.[0] || "https://images.unsplash.com/photo-1540103711724-ee7234656248?auto=format&fit=crop&q=80&w=300"} 
                            alt={prod.name} 
                            className="w-12 h-12 object-cover rounded-xl bg-zinc-950 border border-zinc-800"
                            onError={(e) => {
                              (e.target as any).src = "https://images.unsplash.com/photo-1540103711724-ee7234656248?auto=format&fit=crop&q=80&w=300";
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 max-w-xs font-bold text-white leading-relaxed">
                          <div className="truncate">{prod.name}</div>
                          <div className="text-[10px] text-zinc-500 font-normal truncate mt-0.5">{prod.short_description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs text-zinc-300 font-semibold bg-zinc-850 px-2.5 py-1 rounded-lg border border-zinc-800">
                            {cat ? cat.name : "غير محدد"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {brand ? (
                            <span className="text-xs text-blue-300 font-bold bg-[#3e499e]/10 border border-[#3e499e]/20 px-2.5 py-1 rounded-lg">
                              {brand.name}{brand.name_en ? ` (${brand.name_en})` : ""}
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-500">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-blue-300 font-extrabold">
                          {prod.price ? `${prod.price.toLocaleString("ar-EG")} ج.م` : "عند الطلب"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {prod.is_featured ? (
                            <span className="inline-flex items-center gap-1 bg-[#3e499e]/10 text-blue-300 border border-[#3e499e]/20 text-[10px] font-bold px-2.5 py-1 rounded-full">
                              <Sparkles className="w-3 h-3 fill-blue-300" />
                              <span>نعم</span>
                            </span>
                          ) : (
                            <span className="text-zinc-600 text-xs">لا</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {prod.is_available !== false ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>متوفر</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                              <span>غير متوفر</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-zinc-400 font-mono text-xs">
                          {prod.created_at ? new Date(prod.created_at).toLocaleDateString("ar-EG") : "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-left">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(prod)}
                              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white p-2 rounded-lg border border-zinc-750 transition-colors cursor-pointer"
                              title="تعديل"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setProductToDelete(prod);
                                setErrorMsg(null);
                                setSuccessMsg(null);
                              }}
                              className="bg-red-950/30 hover:bg-red-900/40 text-red-400 hover:text-red-300 p-2 rounded-lg border border-red-900/30 transition-colors cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADD / EDIT PRODUCT FORM MODAL */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative text-right p-6 sm:p-8 space-y-6 max-h-[90vh] flex flex-col">
              
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0">
                <h3 className="text-lg font-black">
                  {editingProduct ? "تعديل بيانات المنتج" : "إضافة منتج صناعي جديد"}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-zinc-500 hover:text-white text-sm cursor-pointer"
                >
                  إغلاق [x]
                </button>
              </div>

              {/* Scrollable form body */}
              <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-1 flex-grow">
                
                {/* 1. Basic Info Section */}
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-blue-300 uppercase tracking-wider border-b border-zinc-800 pb-1.5">1. البيانات العامة والأساسية</h4>
                  
                  {/* Name (Arabic & English) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-zinc-300">اسم المنتج (بالعربي)</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="مثال: صاروخ قطعية وجلخ 1010 واط"
                        className="block w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#3e499e] transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-amber-400/90 flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5 text-amber-400" />
                          <span>اسم المنتج بالإنجليزي (English Name)</span>
                        </label>
                        {isAiTranslationEnabled && (
                          <button
                            type="button"
                            onClick={() => handleTranslateField(name, setNameEn, "name")}
                            disabled={translatingField === "name" || !name.trim()}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {translatingField === "name" ? (
                              <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                            ) : (
                              <Sparkles className="w-3 h-3 text-amber-400" />
                            )}
                            <span>اقتراح ترجمة</span>
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={nameEn}
                        onChange={(e) => setNameEn(e.target.value)}
                        placeholder="e.g. Angle Grinder 1010W"
                        className="block w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition-colors font-sans"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Category Selector */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-zinc-300">القسم الرئيسي الملحق به</label>
                      <select
                        required
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="block w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-300 focus:outline-none focus:border-[#3e499e] transition-colors"
                      >
                        <option value="">-- اختر القسم التابع له --</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}{cat.name_en ? ` (${cat.name_en})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Brand Selector */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-zinc-300">العلامة التجارية (البراند) - اختياري</label>
                      <select
                        value={brandId}
                        onChange={(e) => setBrandId(e.target.value)}
                        className="block w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-300 focus:outline-none focus:border-[#3e499e] transition-colors cursor-pointer"
                      >
                        <option value="">-- بدون براند محدد --</option>
                        {brands.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name}{b.name_en ? ` (${b.name_en})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Price */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="block text-xs font-bold text-zinc-300">السعر المقدر (ج.م) - اختياري</label>
                        <span className="text-[10px] text-zinc-500">اتركه فارغاً لإخفاء السعر</span>
                      </div>
                      <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500">
                          <DollarSign className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="مثال: 3450 (أو اتركه فارغاً)"
                          className="block w-full pr-9 pl-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#3e499e] transition-colors text-right font-mono"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* Featured Checkbox */}
                    <div className="space-y-2 flex flex-col justify-end">
                      <label className="inline-flex items-center gap-3 bg-zinc-950 border border-zinc-800 p-3 rounded-xl cursor-pointer hover:border-[#3e499e]/30 transition-colors h-[46px]">
                        <input
                          type="checkbox"
                          checked={isFeatured}
                          onChange={(e) => setIsFeatured(e.target.checked)}
                          className="rounded text-[#3e499e] focus:ring-[#3e499e] bg-zinc-900 border-zinc-800 w-4.5 h-4.5"
                        />
                        <div className="space-y-0.5">
                          <span className="block text-xs font-bold text-white">تحديد كـ "منتج مميز"</span>
                          <span className="block text-[10px] text-zinc-400">سيظهر في الصفحة الرئيسية للكتالوج</span>
                        </div>
                      </label>
                    </div>

                    {/* Available Checkbox */}
                    <div className="space-y-2 flex flex-col justify-end">
                      <label className="inline-flex items-center gap-3 bg-zinc-950 border border-zinc-800 p-3 rounded-xl cursor-pointer hover:border-[#3e499e]/30 transition-colors h-[46px]">
                        <input
                          type="checkbox"
                          checked={isAvailable}
                          onChange={(e) => setIsAvailable(e.target.checked)}
                          className="rounded text-[#3e499e] focus:ring-[#3e499e] bg-zinc-900 border-zinc-800 w-4.5 h-4.5"
                        />
                        <div className="space-y-0.5">
                          <span className="block text-xs font-bold text-white">المنتج متوفر حالياً</span>
                          <span className="block text-[10px] text-blue-300">مفعّل (يظهر للزوار إمكانية الطلب المباشر)</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Short Description (Arabic & English) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-zinc-300">وصف قصير (بالعربي)</label>
                      <input
                        type="text"
                        required
                        value={shortDescription}
                        onChange={(e) => setShortDescription(e.target.value)}
                        placeholder="اكتب عبارة جذابة ملخصة..."
                        className="block w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#3e499e] transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-amber-400/90 flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5 text-amber-400" />
                          <span>وصف قصير بالإنجليزي (Short Description)</span>
                        </label>
                        {isAiTranslationEnabled && (
                          <button
                            type="button"
                            onClick={() => handleTranslateField(shortDescription, setShortDescriptionEn, "shortDesc")}
                            disabled={translatingField === "shortDesc" || !shortDescription.trim()}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {translatingField === "shortDesc" ? (
                              <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                            ) : (
                              <Sparkles className="w-3 h-3 text-amber-400" />
                            )}
                            <span>اقتراح ترجمة</span>
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={shortDescriptionEn}
                        onChange={(e) => setShortDescriptionEn(e.target.value)}
                        placeholder="e.g. High power brushless motor..."
                        className="block w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition-colors font-sans"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Full Description (Arabic & English) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-zinc-300">تفاصيل المنتج الكاملة (بالعربي)</label>
                      <textarea
                        required
                        value={fullDescription}
                        onChange={(e) => setFullDescription(e.target.value)}
                        rows={4}
                        placeholder="اكتب بالتفصيل مزايا واستخدامات المنتج والمشتملات..."
                        className="block w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#3e499e] transition-colors resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-amber-400/90 flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5 text-amber-400" />
                          <span>تفاصيل المنتج بالإنجليزي (Full Description)</span>
                        </label>
                        {isAiTranslationEnabled && (
                          <button
                            type="button"
                            onClick={() => handleTranslateField(fullDescription, setFullDescriptionEn, "fullDesc")}
                            disabled={translatingField === "fullDesc" || !fullDescription.trim()}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {translatingField === "fullDesc" ? (
                              <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                            ) : (
                              <Sparkles className="w-3 h-3 text-amber-400" />
                            )}
                            <span>اقتراح ترجمة</span>
                          </button>
                        )}
                      </div>
                      <textarea
                        value={fullDescriptionEn}
                        onChange={(e) => setFullDescriptionEn(e.target.value)}
                        rows={4}
                        placeholder="Full product details and specifications in English..."
                        className="block w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition-colors resize-none font-sans"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Specs Builder Section (Dynamic Key-Value Pairs in AR & EN) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 shrink-0">
                    <h4 className="text-xs font-extrabold text-[#3e499e] uppercase tracking-wider">2. جدول المواصفات الفنية المتقدمة (عربي / إنجليزي)</h4>
                    <button
                      type="button"
                      onClick={() => setSpecs([...specs, { key: "", value: "", key_en: "", value_en: "" }])}
                      className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors cursor-pointer font-bold"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>إضافة مواصفة جديدة</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-zinc-400 leading-normal">
                    أدخل المواصفات التقنية كأزواج (خاصية / قيمة) بالعربي والإنجليزي.
                  </p>

                  <div className="space-y-3">
                    {specs.map((item, index) => (
                      <div key={index} className="bg-zinc-950 border border-zinc-800 p-3 rounded-2xl space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {/* Arabic Key & Value */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={item.key}
                              onChange={(e) => {
                                const updated = [...specs];
                                updated[index].key = e.target.value;
                                setSpecs(updated);
                              }}
                              placeholder="الخاصية (مثال: القوة)"
                              className="w-1/2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#3e499e]"
                            />
                            <input
                              type="text"
                              value={item.value}
                              onChange={(e) => {
                                const updated = [...specs];
                                updated[index].value = e.target.value;
                                setSpecs(updated);
                              }}
                              placeholder="القيمة (مثال: 800 واط)"
                              className="w-1/2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#3e499e]"
                            />
                          </div>

                          {/* English Key & Value */}
                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={item.key_en || ""}
                              onChange={(e) => {
                                const updated = [...specs];
                                updated[index].key_en = e.target.value;
                                setSpecs(updated);
                              }}
                              placeholder="Spec Key EN (Power)"
                              className="w-5/12 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-sans"
                              dir="ltr"
                            />
                            <input
                              type="text"
                              value={item.value_en || ""}
                              onChange={(e) => {
                                const updated = [...specs];
                                updated[index].value_en = e.target.value;
                                setSpecs(updated);
                              }}
                              placeholder="Spec Value EN (800W)"
                              className="w-5/12 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-sans"
                              dir="ltr"
                            />

                            {isAiTranslationEnabled && (
                              <button
                                type="button"
                                onClick={async () => {
                                  setTranslatingField(`spec_${index}`);
                                  const translatedKey = item.key ? await translateText(item.key) : "";
                                  const translatedVal = item.value ? await translateText(item.value) : "";
                                  const updated = [...specs];
                                  if (translatedKey) updated[index].key_en = translatedKey;
                                  if (translatedVal) updated[index].value_en = translatedVal;
                                  setSpecs(updated);
                                  setTranslatingField(null);
                                }}
                                disabled={translatingField === `spec_${index}`}
                                className="p-2 text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl shrink-0 cursor-pointer disabled:opacity-50"
                                title="اقتراح ترجمة الخاصية والقيمة"
                              >
                                {translatingField === `spec_${index}` ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                                ) : (
                                  <Sparkles className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                const updated = specs.filter((_, i) => i !== index);
                                setSpecs(updated.length > 0 ? updated : [{ key: "", value: "", key_en: "", value_en: "" }]);
                              }}
                              className="text-red-400 hover:text-red-300 cursor-pointer p-1 shrink-0"
                              title="حذف الخاصية"
                            >
                              <MinusCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Product Features / Badges Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 shrink-0">
                    <h4 className="text-xs font-extrabold text-[#3e499e] uppercase tracking-wider">3. مميزات وبادجات المنتج المخصصة (عربي / إنجليزي)</h4>
                  </div>
                  
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    أضف مميزات مخصصة تظهر كشارات/علامات تميز هذا المنتج باللغتين العربية والإنجليزية.
                  </p>

                  {/* Suggestion Quick Tags */}
                  <div className="space-y-2">
                    <span className="block text-[10px] font-bold text-zinc-400">اقتراحات سريعة للإضافة بنقرة واحدة:</span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { ar: "ضمان أصلي معتمد لجميع الأجهزة", en: "Original Warranty Included" },
                        { ar: "توفر دائم لقطع الغيار الأصلية والصيانة", en: "Original Spare Parts Available" },
                        { ar: "ملفات نحاس 100% شديدة التحمل", en: "100% Heavy-duty Copper Winding" },
                        { ar: "تصميم مريح مانع للانزلاق", en: "Ergonomic Anti-slip Design" },
                        { ar: "سرعات متغيرة ذكية", en: "Smart Variable Speeds" },
                        { ar: "صناعة متينة عالية الجودة", en: "Durable High Quality Build" }
                      ].map((suggested) => {
                        const alreadyAdded = features.some(f => f.ar === suggested.ar);
                        return (
                          <button
                            key={suggested.ar}
                            type="button"
                            disabled={alreadyAdded}
                            onClick={() => setFeatures([...features, suggested])}
                            className={`text-[10px] px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                              alreadyAdded
                                ? "bg-zinc-800/50 border-zinc-800/80 text-zinc-500 cursor-not-allowed"
                                : "bg-zinc-950 hover:bg-zinc-850 border-zinc-800 text-zinc-350 hover:border-[#3e499e]/40"
                            }`}
                          >
                            + {suggested.ar}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Feature list table/inputs */}
                  <div className="space-y-2">
                    {features.length === 0 ? (
                      <div className="text-[10px] text-zinc-500 italic p-3 bg-zinc-950 border border-zinc-800/60 rounded-xl">
                        لم يتم إضافة أي مميزات مخصصة بعد. اختر من الاقتراحات أعلاه أو أضف ميزة جديدة.
                      </div>
                    ) : (
                      features.map((feat, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl">
                          <input
                            type="text"
                            value={feat.ar}
                            onChange={(e) => {
                              const updated = [...features];
                              updated[idx].ar = e.target.value;
                              setFeatures(updated);
                            }}
                            placeholder="الميزة (بالعربي)"
                            className="w-1/2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#3e499e]"
                          />
                          <input
                            type="text"
                            value={feat.en}
                            onChange={(e) => {
                              const updated = [...features];
                              updated[idx].en = e.target.value;
                              setFeatures(updated);
                            }}
                            placeholder="Feature in English"
                            className="w-1/2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 font-sans"
                            dir="ltr"
                          />

                          {isAiTranslationEnabled && (
                            <button
                              type="button"
                              onClick={async () => {
                                if (!feat.ar) return;
                                setTranslatingField(`feat_${idx}`);
                                const resEn = await translateText(feat.ar);
                                if (resEn) {
                                  const updated = [...features];
                                  updated[idx].en = resEn;
                                  setFeatures(updated);
                                }
                                setTranslatingField(null);
                              }}
                              disabled={translatingField === `feat_${idx}`}
                              className="p-1.5 text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg shrink-0 cursor-pointer disabled:opacity-50"
                              title="اقتراح ترجمة الميزة"
                            >
                              {translatingField === `feat_${idx}` ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setFeatures(features.filter((_, i) => i !== idx))}
                            className="text-red-400 hover:text-red-300 p-1 shrink-0 cursor-pointer"
                            title="حذف الميزة"
                          >
                            <MinusCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add manual feature button */}
                  <button
                    type="button"
                    onClick={() => setFeatures([...features, { ar: "", en: "" }])}
                    className="inline-flex items-center gap-1.5 text-xs text-[#3e499e] hover:text-blue-400 font-bold bg-[#3e499e]/10 hover:bg-[#3e499e]/20 border border-[#3e499e]/30 px-3 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة ميزة مخصصة أخرى</span>
                  </button>
                </div>

                {/* 4. Product Gallery (Multi-Image Upload) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 shrink-0">
                    <h4 className="text-xs font-extrabold text-[#3e499e] uppercase tracking-wider">4. معرض صور المنتج</h4>
                    <span className="text-[10px] text-zinc-500">الصورة الأولى هي الصورة الرئيسية للمنتج</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center justify-center gap-2 bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 rounded-xl px-4 py-3 cursor-pointer text-xs font-bold transition-all text-white">
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[#3e499e]" />
                            <span>جاري معالجة الصور...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-blue-300" />
                            <span>رفع صور جديدة للمعرض</span>
                          </>
                        )}
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleGalleryUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                      <p className="text-[10px] text-zinc-500">يمكنك رفع عدة صور دفعة واحدة وترتيبها بالأزرار أدناه.</p>
                    </div>

                    {/* Image thumbnails list with sort buttons */}
                    {gallery.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                        {gallery.map((url, idx) => (
                          <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-2.5 space-y-2 relative group">
                            <img 
                              src={url} 
                              alt={`Gallery ${idx}`} 
                              className="w-full h-24 object-cover rounded-xl bg-zinc-900 border border-zinc-800"
                            />
                            
                            <div className="absolute top-4 right-4 bg-zinc-950/95 border border-zinc-800/80 rounded-full font-mono text-[9px] w-5 h-5 flex items-center justify-center font-bold text-blue-300">
                              {idx + 1}
                            </div>

                            {/* Sort & Delete Controls */}
                            <div className="flex justify-between items-center gap-1.5 pt-1">
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveImage(idx, "up")}
                                  className="bg-zinc-900 hover:bg-zinc-800 disabled:text-zinc-700 text-zinc-400 p-1.5 rounded border border-zinc-800 transition-colors cursor-pointer"
                                  title="تحريك للأمام"
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === gallery.length - 1}
                                  onClick={() => handleMoveImage(idx, "down")}
                                  className="bg-zinc-900 hover:bg-zinc-800 disabled:text-zinc-700 text-zinc-400 p-1.5 rounded border border-zinc-800 transition-colors cursor-pointer"
                                  title="تحريك للخلف"
                                >
                                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="text-red-400 hover:text-red-300 text-xs font-bold p-1 cursor-pointer"
                                title="حذف"
                              >
                                حذف
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {errorMsg && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs flex items-start gap-2.5 shrink-0">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl text-xs flex items-start gap-2.5 shrink-0">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

              </form>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-zinc-800 hover:bg-zinc-750 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء التراجع
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || uploading}
                  className="bg-[#3e499e] hover:bg-[#323a7e] disabled:bg-zinc-800 disabled:text-zinc-500 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-lg"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingProduct ? "حفظ تعديلات المنتج" : "إضافة المنتج للكتالوج"}</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* DELETE PRODUCT CONFIRMATION MODAL */}
        {productToDelete && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6 text-right">
              
              <div className="flex items-center gap-3 text-red-400">
                <Trash2 className="w-6 h-6 shrink-0" />
                <h3 className="text-lg font-black">تأكيد حذف المنتج</h3>
              </div>

              <div className="space-y-2">
                <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">
                  هل أنت متأكد تماماً من رغبتك في حذف المنتج: <strong className="text-white">{productToDelete.name}</strong>؟
                </p>
                <p className="text-zinc-500 text-xs">
                  هذا الإجراء سيقوم بإزالة كافة صور هذا المنتج من المعارض المرتبطة نهائياً.
                </p>
              </div>

              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProductToDelete(null)}
                  className="bg-zinc-800 hover:bg-zinc-750 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  تراجع
                </button>
                <button
                  onClick={handleDeleteProduct}
                  disabled={submitting}
                  className="bg-red-650 hover:bg-red-750 disabled:bg-zinc-800 disabled:text-zinc-500 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>حذف المنتج الآن</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
