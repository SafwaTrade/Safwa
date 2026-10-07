import React, { useState, useEffect, useMemo, ChangeEvent } from "react";
import { Category, Product } from "../types";
import { getSupabase } from "../lib/supabase";

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
  FolderTree, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  Check, 
  Image as ImageIcon,
  HelpCircle
} from "lucide-react";

interface AdminCategoriesProps {
  categories: Category[];
  products: Product[];
  onRefresh: () => void;
  onNavigateToDashboard: () => void;
}

export default function AdminCategories({
  categories,
  products,
  onRefresh,
  onNavigateToDashboard,
}: AdminCategoriesProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Delete category safety flow
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleteStrategy, setDeleteStrategy] = useState<"prevent" | "move" | "cascade">("prevent");
  const [transferCategoryId, setTransferCategoryId] = useState("");

  const linkedProducts = useMemo(() => {
    if (!categoryToDelete) return [];
    return products.filter(p => String(p.category_id).trim().toLowerCase() === String(categoryToDelete.id).trim().toLowerCase());
  }, [categoryToDelete, products]);

  // Handle name change to auto-generate slug if not manually touched
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
      .replace(/[^\u0600-\u06FF\w\s-]/g, "") // Keep Arabic letters, English letters, digits, spaces, and hyphens
      .replace(/[\s_]+/g, "-") // Replace spaces/underscores with hyphens
      .replace(/-+/g, "-"); // Collapse multiple hyphens
  };

  const handleSlugChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
    setIsSlugManuallyEdited(true);
  };

  // Direct Image Upload to Supabase Storage
  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg(null);

    const supabase = getSupabase();
    if (supabase) {
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        // Attempt upload to "products" bucket
        let { data, error } = await supabase.storage
          .from("products")
          .upload(filePath, file, { cacheControl: "3600", upsert: true });

        // Fallback to "images" bucket
        if (error) {
          const secondary = await supabase.storage
            .from("images")
            .upload(filePath, file, { cacheControl: "3600", upsert: true });
          
          if (secondary.error) {
            throw new Error(`خطأ في رفع الملف: تأكد من إنشاء bucket باسم "products" أو "images" وجعله عاماً (Public). تفاصيل الخطأ: ${secondary.error.message}`);
          }
          data = secondary.data;
        }

        // Get public url
        const bucketName = error ? "images" : "products";
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        setImageUrl(urlData.publicUrl);
        setSuccessMsg("تم رفع الصورة بنجاح وتوليد الرابط تلقائياً!");
      } catch (err: any) {
        console.error("Storage upload error:", err);
        // Fallback to Base64 read so client testing works perfectly even if offline
        try {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === "string") {
              setImageUrl(reader.result);
              setSuccessMsg("تعذر الرفع لـ Supabase Storage، تم حفظ الصورة محلياً (Base64) بنجاح للتجربة!");
            }
          };
          reader.readAsDataURL(file);
        } catch {
          setErrorMsg(err.message || "فشل رفع الصورة إلى الخادم.");
        }
      }
    } else {
      // Supabase is offline/not configured, read as Base64 data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setImageUrl(reader.result);
          setSuccessMsg("Supabase غير متصل، تم حفظ الصورة محلياً (Base64) بنجاح للتجربة!");
        }
      };
      reader.readAsDataURL(file);
    }
    setUploading(false);
  };

  // Open Form for Add
  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName("");
    setNameEn("");
    setSlug("");
    setDescription("");
    setDescriptionEn("");
    setImageUrl("");
    setIsSlugManuallyEdited(false);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setNameEn(cat.name_en || "");
    setSlug(cat.slug);
    setDescription(cat.description || "");
    setDescriptionEn(cat.description_en || "");
    setImageUrl(cat.image_url);
    setIsSlugManuallyEdited(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsFormOpen(true);
  };

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug || !imageUrl) {
      setErrorMsg("الرجاء ملء حقل الاسم بالعربي، الـ slug، ورفع الصورة.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const supabase = getSupabase();
    const finalId = editingCategory ? editingCategory.id : generateUUID();

    const categoryData = {
      name,
      name_en: nameEn.trim() || null,
      slug,
      description,
      description_en: descriptionEn.trim() || null,
      image_url: imageUrl,
    };

    try {
      if (supabase) {
        let error;
        if (editingCategory) {
          const { error: err } = await supabase
            .from("categories")
            .update(categoryData)
            .eq("id", editingCategory.id);
          error = err;
        } else {
          const { error: err } = await supabase
            .from("categories")
            .insert([{ id: finalId, ...categoryData }]);
          error = err;
        }

        if (error) throw error;

        setSuccessMsg(editingCategory ? "تم تعديل القسم بنجاح!" : "تم إضافة القسم الجديد بنجاح!");
        setTimeout(() => {
          setIsFormOpen(false);
          onRefresh();
        }, 800);
      } else {
        throw new Error("فشل الاتصال بقاعدة البيانات. يرجى تهيئة Supabase أولاً لحفظ الأقسام.");
      }
    } catch (err: any) {
      console.error("Database category save error:", err);
      let localizedError = err.message || JSON.stringify(err);
      if (localizedError.includes("row-level security") || localizedError.includes("violates row-level security policy")) {
        localizedError = "فشل الإجراء بسبب صلاحيات الحماية RLS في Supabase. يرجى تفعيل سياسة السماح بالإدخال والتعديل لجدول الأقسام (categories).";
      }
      setErrorMsg(`فشل الحفظ في قاعدة البيانات: ${localizedError}. لم يتم إغلاق الفورم لتتمكن من مراجعة المدخلات.`);
    } finally {
      setSubmitting(false);
    }
  };

  // Deletion logic with linked products strategy handling
  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    
    setSubmitting(true);
    setErrorMsg(null);

    const supabase = getSupabase();
    
    try {
      if (supabase) {
        // Apply strategies if there are linked products
        if (linkedProducts.length > 0) {
          if (deleteStrategy === "prevent") {
            setErrorMsg("لا يمكن الحذف: يرجى تفريغ المنتجات أو اختيار استراتيجية نقل أو حذف كاسح.");
            setSubmitting(false);
            return;
          } else if (deleteStrategy === "move") {
            if (!transferCategoryId) {
              setErrorMsg("الرجاء اختيار القسم البديل لنقل المنتجات إليه.");
              setSubmitting(false);
              return;
            }
            // Move products
            const { error: updateError } = await supabase
              .from("products")
              .update({ category_id: transferCategoryId })
              .eq("category_id", categoryToDelete.id);

            if (updateError) throw updateError;
          } else if (deleteStrategy === "cascade") {
            // Cascade is handled by Postgres foreign key ON DELETE CASCADE automatically,
            // but just in case, we can manually delete products first
            const { error: deleteProdsError } = await supabase
              .from("products")
              .delete()
              .eq("category_id", categoryToDelete.id);

            if (deleteProdsError) throw deleteProdsError;
          }
        }

        // Delete the category itself
        const { error: catDeleteError } = await supabase
          .from("categories")
          .delete()
          .eq("id", categoryToDelete.id);

        if (catDeleteError) throw catDeleteError;
      } else {
        throw new Error("لا يوجد اتصال بـ Supabase للقيام بعملية حذف القسم.");
      }

      setSuccessMsg("تم حذف القسم بنجاح!");
      setTimeout(() => {
        setCategoryToDelete(null);
        onRefresh();
      }, 800);
    } catch (err: any) {
      console.error("Deletion error:", err);
      setErrorMsg(`خطأ أثناء الحذف: ${err.message}`);
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
              <h1 className="text-xl sm:text-2xl font-black">إدارة الأقسام الرئيسية</h1>
              <p className="text-zinc-400 text-xs">عرض وإضافة وتعديل الأقسام التي تظهر للمستخدمين</p>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 bg-[#3e499e] hover:bg-[#323a7e] text-white px-4 py-2.5 rounded-xl text-xs font-black transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة قسم جديد</span>
          </button>
        </div>

        {/* Categories Table View */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right border-collapse">
              <thead>
                <tr className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 text-xs font-bold uppercase">
                  <th className="px-6 py-4">صورة القسم</th>
                  <th className="px-6 py-4">اسم القسم</th>
                  <th className="px-6 py-4">الـ Slug (رابط فريد)</th>
                  <th className="px-6 py-4">الوصف</th>
                  <th className="px-6 py-4 text-center">المنتجات المرتبطة</th>
                  <th className="px-6 py-4 text-left">التحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                      <FolderTree className="w-8 h-8 mx-auto text-zinc-600 mb-2.5" />
                      <p className="text-xs">لم يتم العثور على أي أقسام بعد. انقر على "إضافة قسم جديد" للبدء.</p>
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => {
                    // Count linked products
                    const count = products.filter(p => String(p.category_id).trim().toLowerCase() === String(cat.id).trim().toLowerCase()).length;
                    return (
                      <tr key={cat.id} className="hover:bg-zinc-900/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img 
                            src={cat.image_url} 
                            alt={cat.name} 
                            className="w-12 h-12 object-cover rounded-xl bg-zinc-950 border border-zinc-800"
                            onError={(e) => {
                              (e.target as any).src = "https://images.unsplash.com/photo-1540103711724-ee7234656248?auto=format&fit=crop&q=80&w=300";
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-white">
                          <div>{cat.name}</div>
                          {cat.name_en && (
                            <div className="text-xs font-normal text-zinc-400 font-sans mt-0.5" dir="ltr">
                              {cat.name_en}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-zinc-400 text-xs">
                          {cat.slug}
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate text-zinc-400 text-xs">
                          {cat.description || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="bg-zinc-850 text-zinc-300 font-mono text-xs px-2.5 py-1 rounded-full border border-zinc-800">
                            {count} منتجات
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-left">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(cat)}
                              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white p-2 rounded-lg border border-zinc-750 transition-colors cursor-pointer"
                              title="تعديل"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setCategoryToDelete(cat);
                                setDeleteStrategy("prevent");
                                setTransferCategoryId("");
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

        {/* ADD / EDIT MODAL FORM */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative text-right p-6 sm:p-8 space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <h3 className="text-lg font-black">
                  {editingCategory ? "تعديل القسم الحالي" : "إضافة قسم رئيسي جديد"}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-zinc-500 hover:text-white text-sm cursor-pointer"
                >
                  إغلاق [x]
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Name (Arabic & English) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-zinc-300">اسم القسم (بالعربي)</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={handleNameChange}
                      placeholder="مثال: ثلاجات"
                      className="block w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#3e499e] transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-zinc-300 flex items-center justify-between">
                      <span>الاسم بالإنجليزي</span>
                      <span className="text-[10px] text-zinc-500 font-normal">اختياري</span>
                    </label>
                    <input
                      type="text"
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                      placeholder="e.g. Refrigerators"
                      className="block w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#3e499e] transition-colors"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Slug */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-zinc-300">الـ Slug (رابط فريد بالمتصفح)</label>
                    <span className="text-[10px] text-zinc-550">سيتم ملؤه تلقائياً من الاسم</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={handleSlugChange}
                    placeholder="مثال: refrigerators"
                    className="block w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#3e499e] transition-colors"
                    dir="ltr"
                  />
                </div>

                {/* Description (Arabic & English) */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-zinc-300 font-semibold">وصف القسم بالعربي (اختياري)</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      placeholder="اكتب وصفاً مختصراً باللغة العربية يوضح طبيعة المنتجات..."
                      className="block w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#3e499e] transition-colors resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-zinc-300 font-semibold flex items-center justify-between">
                      <span>وصف القسم بالإنجليزي</span>
                      <span className="text-[10px] text-zinc-500 font-normal">اختياري</span>
                    </label>
                    <textarea
                      value={descriptionEn}
                      onChange={(e) => setDescriptionEn(e.target.value)}
                      rows={2}
                      placeholder="Short category description in English..."
                      className="block w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#3e499e] transition-colors resize-none"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Image upload / URL */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-zinc-300 font-semibold">صورة الغلاف للقسم</label>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="رابط الصورة المباشر أو ارفع صورة باليسار..."
                      className="block flex-grow px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#3e499e] transition-colors"
                      dir="ltr"
                    />
                    
                    <label className="bg-zinc-800 hover:bg-zinc-750 text-white px-4 rounded-xl border border-zinc-750 cursor-pointer flex items-center justify-center transition-colors">
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="hidden" 
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  
                  {imageUrl && (
                    <div className="mt-2.5 relative inline-block">
                      <img 
                        src={imageUrl} 
                        alt="Preview" 
                        className="w-24 h-24 object-cover rounded-xl border border-zinc-800 bg-zinc-950" 
                      />
                      <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        className="absolute -top-1.5 -right-1.5 bg-red-650 hover:bg-red-700 text-white rounded-full p-1 text-[9px] w-5 h-5 flex items-center justify-center font-bold"
                      >
                        x
                      </button>
                    </div>
                  )}
                </div>

                {errorMsg && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs flex items-start gap-2 leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs flex items-start gap-2 leading-relaxed">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="pt-4 border-t border-zinc-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="bg-zinc-800 hover:bg-zinc-750 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || uploading}
                    className="bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 px-5 py-2.5 rounded-xl text-xs font-black transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingCategory ? "حفظ التغييرات" : "إضافة القسم"}</span>
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL WITH LINKED PRODUCTS DELETION STRATEGY */}
        {categoryToDelete && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6 text-right">
              
              <div className="flex items-center gap-3 text-red-400">
                <Trash2 className="w-6 h-6 shrink-0" />
                <h3 className="text-lg font-black">حذف القسم: {categoryToDelete.name}</h3>
              </div>

              <div className="space-y-4">
                <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">
                  هل أنت متأكد تماماً من رغبتك في حذف هذا القسم؟ هذه العملية لا يمكن التراجع عنها لاحقاً.
                </p>

                {/* Warning about linked products */}
                {linkedProducts.length > 0 ? (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 space-y-3.5">
                    <div className="flex gap-2 text-red-400">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="text-xs font-extrabold">تنبيه حرج: يوجد عدد {linkedProducts.length} منتجات مرتبطة بهذا القسم!</span>
                    </div>
                    
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      الرجاء اختيار آلية التعامل المناسبة مع المنتجات المرتبطة لحماية سلامة قاعدة البيانات:
                    </p>

                    {/* Strategies Select */}
                    <div className="space-y-2 text-xs">
                      
                      {/* Strategy 1: Prevent */}
                      <label className="flex items-center gap-2 cursor-pointer bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800">
                        <input
                          type="radio"
                          name="deleteStrategy"
                          checked={deleteStrategy === "prevent"}
                          onChange={() => setDeleteStrategy("prevent")}
                          className="text-amber-500 focus:ring-0"
                        />
                        <span className="text-zinc-300">منع الحذف حتى يتم نقل المنتجات يدوياً (أمان كامل)</span>
                      </label>

                      {/* Strategy 2: Move */}
                      <label className="flex flex-col gap-2 bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="deleteStrategy"
                            checked={deleteStrategy === "move"}
                            onChange={() => setDeleteStrategy("move")}
                            className="text-amber-500 focus:ring-0"
                          />
                          <span className="text-zinc-300 font-bold">نقل المنتجات لقسم بديل (الخيار الموصى به)</span>
                        </div>

                        {deleteStrategy === "move" && (
                          <div className="pt-2 pl-6">
                            <select
                              required
                              value={transferCategoryId}
                              onChange={(e) => setTransferCategoryId(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-850 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                            >
                              <option value="">-- اختر القسم البديل للنقل إليه --</option>
                              {categories
                                .filter(c => c.id !== categoryToDelete.id)
                                .map(c => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))
                              }
                            </select>
                          </div>
                        )}
                      </label>

                      {/* Strategy 3: Cascade Delete */}
                      <label className="flex items-center gap-2 cursor-pointer bg-red-950/10 p-2.5 rounded-xl border border-red-900/10">
                        <input
                          type="radio"
                          name="deleteStrategy"
                          checked={deleteStrategy === "cascade"}
                          onChange={() => setDeleteStrategy("cascade")}
                          className="text-red-500 focus:ring-0"
                        />
                        <span className="text-red-400 font-bold">حذف القسم مع حذف كافة المنتجات المرتبطة به تلقائياً</span>
                      </label>

                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 flex items-center gap-2.5 text-emerald-400 text-xs">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>آمن للحذف! لا توجد منتجات حالية مرتبطة بهذا القسم.</span>
                  </div>
                )}
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
                  onClick={() => setCategoryToDelete(null)}
                  className="bg-zinc-800 hover:bg-zinc-750 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء التراجع
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={submitting || (linkedProducts.length > 0 && deleteStrategy === "prevent")}
                  className="bg-red-650 hover:bg-red-750 disabled:bg-zinc-800 disabled:text-zinc-500 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>حذف القسم والبيانات</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
