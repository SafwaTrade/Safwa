import React, { useState, useEffect, ChangeEvent } from "react";
import { Brand } from "../types";
import { getSupabase } from "../lib/supabase";
import { useSiteContent } from "../context/SiteContentContext";
import { 
  Award, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  Check, 
  Image as ImageIcon,
  HelpCircle,
  TrendingUp,
  Sparkles
} from "lucide-react";

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

interface AdminBrandsProps {
  onNavigateToDashboard: () => void;
  onRefresh?: () => void;
}

// Pre-seeded brands for demonstration
export const defaultBrands: Brand[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Black + Decker",
    name_en: "Black + Decker",
    slug: "black-decker",
    logo_url: "https://images.unsplash.com/photo-1534224039826-c7a0eda0e6b3?auto=format&fit=crop&q=80&w=200",
    sort_order: 1
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "براون",
    name_en: "Braun",
    slug: "braun",
    logo_url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=200",
    sort_order: 2
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "فريش",
    name_en: "Fresh",
    slug: "fresh",
    logo_url: "https://images.unsplash.com/photo-1571175432247-50a2f4f69768?auto=format&fit=crop&q=80&w=200",
    sort_order: 3
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    name: "كينوود",
    name_en: "Kenwood",
    slug: "kenwood",
    logo_url: "https://images.unsplash.com/photo-1578643463396-0997cb5328c1?auto=format&fit=crop&q=80&w=200",
    sort_order: 4
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    name: "فيليبس",
    name_en: "Philips",
    slug: "philips",
    logo_url: "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&q=80&w=200",
    sort_order: 5
  },
  {
    id: "66666666-6666-6666-6666-666666666666",
    name: "تورنيدو",
    name_en: "Tornado",
    slug: "tornado",
    logo_url: "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&q=80&w=200",
    sort_order: 6
  }
];

export default function AdminBrands({ onNavigateToDashboard, onRefresh }: AdminBrandsProps) {
  const { getText } = useSiteContent();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const handleSuggestTranslation = () => {
    if (!name.trim()) return;
    const known: Record<string, string> = {
      "براون": "Braun",
      "فريش": "Fresh",
      "كينوود": "Kenwood",
      "فيليبس": "Philips",
      "تورنيدو": "Tornado",
      "بلاك اند ديكر": "Black + Decker",
      "بلاك + ديكر": "Black + Decker",
      "توشيبا": "Toshiba",
      "سامسونج": "Samsung",
      "إل جي": "LG",
      "ال جي": "LG",
      "شارب": "Sharp",
      "كريازي": "Kiriazi",
      "وايت بوينت": "White Point",
      "وايت بوينت العبد": "White Point",
      "أريستون": "Ariston",
      "ارستون": "Ariston",
      "ميلا": "Miele",
      "بوش": "Bosch",
      "اليكتروستار": "Electrostar",
      "الكتروستار": "Electrostar",
      "وايت وستنجهاوس": "White Westinghouse",
      "زانوسي": "Zanussi",
      "إنديسيت": "Indesit",
      "بيكو": "Beko",
      "ميديا": "Midea",
      "هاير": "Haier",
      "ماكيتا": "Makita",
      "ديوالت": "DeWalt",
      "إنكو": "Ingco",
      "توتال": "Total Tools",
      "ستانلي": "Stanley",
      "ميلووكي": "Milwaukee",
      "كراون": "Crown"
    };

    const clean = name.trim();
    if (known[clean]) {
      setNameEn(known[clean]);
      return;
    }

    for (const [ar, en] of Object.entries(known)) {
      if (clean.includes(ar)) {
        setNameEn(en);
        return;
      }
    }

    // Default formatting
    if (/^[a-zA-Z0-9\s&+-]+$/.test(clean)) {
      setNameEn(clean);
    } else {
      setNameEn(clean);
    }
  };

  // Action status
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showSqlNotice, setShowSqlNotice] = useState(false);

  // Delete safety
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);

  const fetchBrands = async () => {
    setLoading(true);
    const supabase = getSupabase();
    
    // 1. Preload local storage brands if any
    let localBrands: Brand[] = [];
    try {
      const stored = localStorage.getItem("safwa_local_brands");
      if (stored) {
        localBrands = JSON.parse(stored);
      } else {
        localBrands = [...defaultBrands];
        localStorage.setItem("safwa_local_brands", JSON.stringify(localBrands));
      }
    } catch (e) {
      console.error("Local storage read error:", e);
      localBrands = [...defaultBrands];
    }

    if (!supabase) {
      // Offline/No Config fallback
      setBrands(localBrands.sort((a, b) => a.sort_order - b.sort_order));
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) {
        console.warn("Brands table might not exist yet. Falling back to Local Storage.", error.message);
        setShowSqlNotice(true);
        setBrands(localBrands.sort((a, b) => a.sort_order - b.sort_order));
      } else if (data) {
        setBrands(data);
      }
    } catch (err) {
      console.error("Error reading from Supabase brands table:", err);
      setBrands(localBrands.sort((a, b) => a.sort_order - b.sort_order));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isSlugManuallyEdited) {
      setSlug(generateSlug(val));
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\u0600-\u06FF\w\s-]/g, "") // Keep Arabic letters, English, digits, spaces, and hyphens
      .replace(/[\s_]+/g, "-") // Replace spaces/underscores with hyphens
      .replace(/-+/g, "-"); // Collapse multiple hyphens
  };

  const handleSlugChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
    setIsSlugManuallyEdited(true);
  };

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const fileExt = file.name.split(".").pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}.${fileExt}`;
          const filePath = `brands/${fileName}`;

          // Attempt upload to brand-logos bucket
          let { data, error } = await supabase.storage
            .from("brand-logos")
            .upload(filePath, file, { cacheControl: "3600", upsert: true });

          // Fallback to "products" bucket if brand-logos doesn't exist
          if (error) {
            const secondary = await supabase.storage
              .from("products")
              .upload(`brands/${fileName}`, file, { cacheControl: "3600", upsert: true });
            
            if (secondary.error) {
              throw new Error(`خطأ في رفع الملف: تأكد من إنشاء bucket باسم "brand-logos" وجعله عاماً (Public). تفاصيل الخطأ: ${secondary.error.message}`);
            }
            const { data: urlData } = supabase.storage.from("products").getPublicUrl(`brands/${fileName}`);
            setLogoUrl(urlData.publicUrl);
          } else {
            const { data: urlData } = supabase.storage.from("brand-logos").getPublicUrl(filePath);
            setLogoUrl(urlData.publicUrl);
          }

          setSuccessMsg("تم رفع الشعار بنجاح وتوليد الرابط!");
        } catch (err: any) {
          console.error("Storage upload error:", err);
          // Fallback to Base64 read so client testing works perfectly
          await new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === "string") {
                setLogoUrl(reader.result);
                setSuccessMsg("تعذر الرفع لـ Supabase Storage، تم حفظ الشعار محلياً (Base64) بنجاح للتجربة!");
                resolve();
              } else {
                reject(new Error("فشل قراءة الملف محلياً."));
              }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          });
        }
      } else {
        // Supabase is offline/not configured, read as Base64 data URL
        await new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === "string") {
              setLogoUrl(reader.result);
              setSuccessMsg("تم حفظ الشعار محلياً (Base64) بنجاح للتجربة!");
              resolve();
            } else {
              reject(new Error("فشل قراءة الملف محلياً."));
            }
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
      }
    } catch (err: any) {
      console.error("File upload failed:", err);
      setErrorMsg(err.message || "فشل رفع الصورة.");
    } finally {
      setUploading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingBrand(null);
    setName("");
    setNameEn("");
    setSlug("");
    setLogoUrl("");
    setSortOrder(brands.length > 0 ? Math.max(...brands.map(b => b.sort_order)) + 1 : 0);
    setIsSlugManuallyEdited(false);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setName(brand.name);
    setNameEn(brand.name_en || "");
    setSlug(brand.slug);
    setLogoUrl(brand.logo_url || "");
    setSortOrder(brand.sort_order);
    setIsSlugManuallyEdited(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      setErrorMsg("يرجى ملء جميع الحقول المطلوبة (الاسم والـ slug)");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const brandData = {
      name: name.trim(),
      name_en: nameEn.trim() || undefined,
      slug: slug.trim(),
      logo_url: logoUrl || undefined,
      sort_order: Number(sortOrder)
    };

    const supabase = getSupabase();
    let savedToCloud = false;

    if (supabase) {
      try {
        if (editingBrand) {
          const { error } = await supabase
            .from("brands")
            .update(brandData)
            .eq("id", editingBrand.id);

          if (!error) savedToCloud = true;
          else throw error;
        } else {
          const { error } = await supabase
            .from("brands")
            .insert([{ ...brandData, id: generateUUID() }]);

          if (!error) savedToCloud = true;
          else throw error;
        }
      } catch (err: any) {
        console.warn("Could not write to Supabase table, falling back to Local Storage:", err.message);
        setShowSqlNotice(true);
      }
    }

    // Always sync with LocalStorage so changes are immediate in the preview iframe
    try {
      const stored = localStorage.getItem("safwa_local_brands");
      let localBrands: Brand[] = stored ? JSON.parse(stored) : [...defaultBrands];

      if (editingBrand) {
        localBrands = localBrands.map(b => 
          b.id === editingBrand.id 
            ? { ...b, ...brandData } 
            : b
        );
      } else {
        localBrands.push({
          id: generateUUID(),
          ...brandData
        });
      }

      localStorage.setItem("safwa_local_brands", JSON.stringify(localBrands));
      
      if (savedToCloud) {
        setSuccessMsg("تم حفظ البراند بنجاح في قاعدة البيانات السحابية!");
      } else {
        setSuccessMsg("تم الحفظ في التخزين المحلي بنجاح للتجربة! يرجى التأكد من تشغيل كود SQL لتثبيته سحابياً.");
      }

      setIsFormOpen(false);
      fetchBrands();
      if (onRefresh) {
        onRefresh();
      }
    } catch (e: any) {
      setErrorMsg("حدث خطأ أثناء الحفظ محلياً: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!brandToDelete) return;

    setSubmitting(true);
    const supabase = getSupabase();
    let deletedFromCloud = false;

    if (supabase) {
      try {
        const { error } = await supabase
          .from("brands")
          .delete()
          .eq("id", brandToDelete.id);

        if (!error) deletedFromCloud = true;
      } catch (e) {
        console.error("Supabase delete failed:", e);
      }
    }

    // Always update local storage
    try {
      const stored = localStorage.getItem("safwa_local_brands");
      let localBrands: Brand[] = stored ? JSON.parse(stored) : [...defaultBrands];
      
      localBrands = localBrands.filter(b => b.id !== brandToDelete.id);
      localStorage.setItem("safwa_local_brands", JSON.stringify(localBrands));

      setSuccessMsg("تم حذف البراند بنجاح.");
      setBrandToDelete(null);
      fetchBrands();
      if (onRefresh) {
        onRefresh();
      }
    } catch (err: any) {
      setErrorMsg("حدث خطأ أثناء الحذف: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-zinc-950 min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-right text-white" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-850">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-zinc-400 text-xs">
              <button 
                onClick={onNavigateToDashboard}
                className="hover:text-white transition-colors cursor-pointer"
              >
                لوحة التحكم
              </button>
              <span>/</span>
              <span className="text-blue-300 font-bold">إدارة البراندات والعلامات التجارية</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3 justify-end sm:justify-start">
              <span>العلامات التجارية (البراندات)</span>
              <Award className="w-7 h-7 text-[#3e499e]" />
            </h1>
            <p className="text-zinc-400 text-xs">
              أضف شعارات وأسماء البراندات التي تتعامل معها الشركة (تظهر تلقائياً أسفل الهيرو بالرئيسية)
            </p>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={handleOpenAdd}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-[#3e499e] hover:bg-[#323a7e] text-white font-extrabold px-5 py-3 rounded-xl text-xs transition-all shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة براند جديد</span>
            </button>

            <button
              onClick={onNavigateToDashboard}
              className="inline-flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-bold px-4 py-3 rounded-xl transition-all cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>لوحة التحكم</span>
            </button>
          </div>
        </div>

        {/* Database Status Alert Banner */}
        {showSqlNotice && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-zinc-300 text-xs space-y-2 leading-relaxed">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>تنبيه المزامنة السحابية: جدول البراندات (brands) غير متصل حالياً</span>
            </div>
            <p>
              يتم حفظ وتحديث بيانات البراندات الحالية بنجاح في متصفحك محلياً (LocalStorage) للتجربة المباشرة الفورية. 
              لضمان حفظها بشكل دائم في قاعدة بيانات Supabase السحابية، يرجى تشغيل كود SQL التالي في <strong>SQL Editor</strong> داخل لوحة تحكم Supabase الخاصة بك:
            </p>
            <pre className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-left overflow-x-auto text-[10px] font-mono text-emerald-400 dir-ltr select-all">
{`create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_en text,
  slug text unique not null,
  logo_url text,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.brands add column if not exists name_en text;

alter table public.brands enable row level security;

create policy "Public can read brands"
on public.brands for select
to anon, authenticated
using (true);

create policy "Authenticated can insert brands"
on public.brands for insert
to authenticated
with check (true);

create policy "Authenticated can update brands"
on public.brands for update
to authenticated
using (true);

create policy "Authenticated can delete brands"
on public.brands for delete
to authenticated
using (true);`}
            </pre>
          </div>
        )}

        {/* Success and Error Indicators */}
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-emerald-400 font-bold text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 font-bold text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Brands List Table */}
        {loading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-zinc-500 text-xs">جاري تحميل قائمة البراندات...</p>
          </div>
        ) : brands.length === 0 ? (
          <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl py-20 text-center space-y-4">
            <Award className="w-12 h-12 text-zinc-600 mx-auto" />
            <h3 className="font-extrabold text-zinc-300 text-sm">قائمة البراندات فارغة</h3>
            <p className="text-zinc-500 text-xs max-w-sm mx-auto leading-relaxed">
              لم تقم بإضافة أي براند بعد. يرجى الضغط على زر "إضافة براند جديد" للبدء في تعبئة شعارات شركاء النجاح.
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 bg-zinc-850 hover:bg-zinc-800 text-amber-400 font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة أول براند الآن</span>
            </button>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-zinc-950/60 border-b border-zinc-850 text-zinc-400 font-bold">
                    <th className="p-4 text-center w-24">الشعار</th>
                    <th className="p-4">اسم العلامة التجارية</th>
                    <th className="p-4">الرمز التعريفي (Slug)</th>
                    <th className="p-4 text-center w-28">ترتيب العرض</th>
                    <th className="p-4 text-center w-28">التحكم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/60">
                  {brands.map((brand) => (
                    <tr key={brand.id} className="hover:bg-zinc-850/30 transition-colors">
                      <td className="p-4 text-center">
                        <div className="bg-white/95 p-2 rounded-xl inline-flex items-center justify-center w-16 h-12 shadow-sm border border-zinc-800/20 overflow-hidden">
                          {brand.logo_url ? (
                            <img 
                              src={brand.logo_url} 
                              alt={brand.name} 
                              className="max-w-full max-h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="font-bold text-[10px] text-zinc-400 tracking-wider uppercase">
                              {brand.name.substring(0, 3)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-extrabold text-zinc-100 block">{brand.name}</span>
                        {brand.name_en && (
                          <span className="text-[11px] text-zinc-400 block font-normal dir-ltr text-right">{brand.name_en}</span>
                        )}
                      </td>
                      <td className="p-4">
                        <code className="bg-zinc-950 px-2 py-1 rounded text-[11px] text-blue-300 font-mono">
                          {brand.slug}
                        </code>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-full text-zinc-400 font-bold text-[10px] font-mono">
                          <TrendingUp className="w-3 h-3 text-blue-400" />
                          <span>{brand.sort_order}</span>
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(brand)}
                            className="p-2 bg-zinc-800 hover:bg-[#3e499e] hover:text-white rounded-lg text-zinc-300 transition-colors cursor-pointer"
                            title="تعديل"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setBrandToDelete(brand)}
                            className="p-2 bg-red-900/10 hover:bg-red-600 rounded-lg text-red-400 hover:text-white transition-colors cursor-pointer border border-red-900/20 hover:border-red-600"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add/Edit Slide-over Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
            {/* Click outside backdrop triggers close */}
            <div className="fixed inset-0" onClick={() => setIsFormOpen(false)}></div>

            {/* Modal Card Content */}
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl text-right overflow-hidden shadow-2xl w-full max-w-lg flex flex-col my-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
              <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-zinc-850">
                  <h3 className="text-lg font-black text-white">
                    {editingBrand ? "تعديل بيانات العلامة التجارية" : "إضافة علامة تجارية جديدة"}
                  </h3>
                  <p className="text-zinc-400 text-xs mt-1">
                    أدخل تفاصيل الشعار والمعلومات الفنية لتحديث الموقع تلقائياً
                  </p>
                </div>

                {/* Form Fields - Scrollable body if height is constrained */}
                <div className="p-6 overflow-y-auto space-y-4 flex-1">
                  {/* Brand Name (Arabic) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-400">اسم البراند / العلامة التجارية (بالعربي) *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={handleNameChange}
                      placeholder="مثال: براون أو فريش"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-all text-right"
                    />
                  </div>

                  {/* Brand Name (English) with Suggestion Button */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-zinc-400">الاسم بالإنجليزي (English Name)</label>
                      {getText("ai_translation_suggestion_enabled", "false") === "true" && (
                        <button
                          type="button"
                          onClick={handleSuggestTranslation}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3e499e] hover:text-blue-400 bg-[#3e499e]/10 hover:bg-[#3e499e]/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-[#3e499e]" />
                          <span>اقتراح ترجمة</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                      placeholder="e.g. Braun or Fresh"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-all text-left"
                      dir="ltr"
                    />
                    <p className="text-[10px] text-zinc-500 leading-normal">
                      اختياري. في حالة تركه فارغاً، سيتم إظهار الاسم العربي كبديل تلقائي عند تصفح الموقع بالإنجليزية.
                    </p>
                  </div>

                  {/* Brand Slug */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-400">الرمز التعريفي الفريد (Slug) *</label>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={handleSlugChange}
                      placeholder="مثال: braun أو fresh"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-all text-left font-mono"
                      dir="ltr"
                    />
                    <p className="text-[10px] text-zinc-500 leading-normal">
                      يُستخدم هذا الرابط لفلترة المنتجات لاحقاً وتوليد صفحات مخصصة. يفضل كتابته بحروف صغيرة وبدون مسافات.
                    </p>
                  </div>

                  {/* Brand Logo URL */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-zinc-400">شعار العلامة التجارية (Logo)</label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      <div className="sm:col-span-8">
                        <input
                          type="url"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          placeholder="أو الصق رابط صورة الشعار مباشرة..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-all text-left"
                          dir="ltr"
                        />
                      </div>

                      <div className="sm:col-span-4 relative">
                        <label className={`w-full flex items-center justify-center gap-1 px-3 py-3 border border-dashed rounded-xl cursor-pointer transition-all text-xs font-bold ${
                          uploading 
                            ? "bg-zinc-800 border-zinc-700 text-zinc-400" 
                            : "bg-zinc-950 border-zinc-800 hover:border-amber-500/50 text-zinc-300 hover:text-amber-400"
                        }`}>
                          {uploading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>يرفع...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5" />
                              <span>رفع شعار</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            disabled={uploading}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Preview of logo in form */}
                    {logoUrl && (
                      <div className="mt-2 bg-white/90 p-3 rounded-xl border border-zinc-800 flex items-center justify-center h-20 overflow-hidden w-28 mx-auto shadow-sm">
                        <img 
                          src={logoUrl} 
                          alt="Logo Preview" 
                          className="max-w-full max-h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>

                  {/* Sort Order */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-400">ترتيب العرض في الموقع</label>
                    <input
                      type="number"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(Number(e.target.value))}
                      placeholder="الرقم الأصغر يظهر أولاً"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-all text-right font-mono"
                      min="0"
                    />
                    <p className="text-[10px] text-zinc-500 leading-normal">
                      تحكم بترتيب عرض الشعار، الرقم الأصغر يظهر في مقدمة شبكة البراندات.
                    </p>
                  </div>
                </div>

                {/* Form Actions Footer */}
                <div className="bg-zinc-950/60 p-6 border-t border-zinc-850 flex flex-row-reverse gap-3 mt-auto shrink-0">
                  <button
                    type="submit"
                    disabled={submitting || uploading}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-[#3e499e] hover:bg-[#323a7e] text-white font-extrabold py-3 rounded-xl text-xs transition-colors shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>جاري الحفظ...</span>
                      </>
                    ) : (
                      <span>حفظ البيانات</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white py-3 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {brandToDelete && (
          <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
            <div className="fixed inset-0" onClick={() => setBrandToDelete(null)}></div>

            <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl text-right overflow-hidden shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 my-auto">
              <div className="p-6 sm:p-8 space-y-4">
                <div className="text-amber-500 p-3 bg-amber-500/10 border border-amber-500/15 rounded-2xl w-fit">
                  <AlertCircle className="w-6 h-6" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">هل أنت متأكد من حذف هذا البراند؟</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    أنت على وشك حذف العلامة التجارية <strong className="text-amber-400">"{brandToDelete.name}"</strong> نهائياً. 
                    سيختفي هذا الشعار مباشرة من الواجهة الرئيسية للموقع. هذا الإجراء لا يمكن التراجع عنه.
                  </p>
                </div>
              </div>

              <div className="bg-zinc-950/60 p-6 border-t border-zinc-850 flex flex-row-reverse gap-3">
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-extrabold py-3 rounded-xl text-xs transition-colors shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                  ) : (
                    <span>تأكيد الحذف النهائي</span>
                  )}
                </button>

                <button
                  onClick={() => setBrandToDelete(null)}
                  className="flex-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white py-3 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  تراجع
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
