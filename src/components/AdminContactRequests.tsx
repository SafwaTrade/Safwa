import React, { useState, useEffect, useMemo } from "react";
import { ContactRequest } from "../types";
import { getSupabase } from "../lib/supabase";
import { utils, writeFile } from "xlsx";
import ContactMethodPicker from "./ContactMethodPicker";
import { 
  ArrowRight, 
  MessageCircle, 
  Mail, 
  Search, 
  Filter, 
  Eye, 
  X, 
  Loader2, 
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  Phone,
  FileSpreadsheet
} from "lucide-react";

interface AdminContactRequestsProps {
  onNavigateToDashboard: () => void;
}

export default function AdminContactRequests({ onNavigateToDashboard }: AdminContactRequestsProps) {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pickerData, setPickerData] = useState<{ phone: string; name: string; message: string; title: string; subtitle: string } | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    setErrorMsg(null);
    const supabase = getSupabase();
    
    let supabaseRequests: ContactRequest[] = [];
    let isSupabaseSuccess = false;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("contact_requests")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data) {
          supabaseRequests = data;
          isSupabaseSuccess = true;
        }
      } catch (err: any) {
        console.error("Supabase fetch error for contact requests:", err);
      }
    }

    // Fetch from localStorage fallback ("electrocore_contact_requests")
    let localRequests: ContactRequest[] = [];
    try {
      const stored = localStorage.getItem("electrocore_contact_requests");
      if (stored) {
        localRequests = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Error parsing local contact requests:", e);
    }

    if (isSupabaseSuccess) {
      setRequests(supabaseRequests);
    } else {
      setRequests(localRequests);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Update status handler
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    setErrorMsg(null);

    const supabase = getSupabase();
    let isSupabaseUpdated = false;

    if (supabase) {
      try {
        const { error } = await supabase
          .from("contact_requests")
          .update({ status: newStatus })
          .eq("id", id);

        if (!error) {
          isSupabaseUpdated = true;
        } else {
          console.error("Supabase update error:", error);
        }
      } catch (err) {
        console.error("Supabase update exception:", err);
      }
    }

    // Update in localStorage to keep it offline-synced
    try {
      const stored = localStorage.getItem("electrocore_contact_requests");
      let localRequests: ContactRequest[] = stored ? JSON.parse(stored) : [];
      
      const updatedLocal = localRequests.map(req => 
        req.id === id ? { ...req, status: newStatus } : req
      );
      localStorage.setItem("electrocore_contact_requests", JSON.stringify(updatedLocal));
      
      if (!isSupabaseUpdated && !supabase) {
        setRequests(updatedLocal);
      }
    } catch (e) {
      console.error("Failed to update status in localStorage:", e);
    }

    if (isSupabaseUpdated) {
      await fetchRequests();
    } else {
      setRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));
    }

    if (selectedRequest && selectedRequest.id === id) {
      setSelectedRequest(prev => prev ? { ...prev, status: newStatus } : null);
    }

    setUpdatingId(null);
  };

  // Filter and search
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesSearch = 
        req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.phone.includes(searchQuery) ||
        req.message.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" ? true : (req.status || "جديد") === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, statusFilter]);

  // Export to Excel handler
  const handleExportExcel = () => {
    if (filteredRequests.length === 0) return;
    
    const dataToExport = filteredRequests.map((req, idx) => ({
      "م": idx + 1,
      "اسم العميل": req.name,
      "رقم الهاتف": req.phone,
      "محتوى الرسالة": req.message,
      "تاريخ الإرسال": new Date(req.created_at).toLocaleString("ar-EG"),
      "الحالة": req.status || "جديد",
    }));

    const worksheet = utils.json_to_sheet(dataToExport);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "طلبات التواصل");
    
    // Set column widths for better layout
    worksheet["!cols"] = [
      { wch: 6 },   // Index
      { wch: 25 },  // Customer Name
      { wch: 18 },  // Phone Number
      { wch: 60 },  // Message
      { wch: 25 },  // Date of submission
      { wch: 15 },  // Status
    ];

    // Enable RTL views for Excel sheets to match Arabic language direction
    if (!worksheet["!views"]) worksheet["!views"] = [];
    worksheet["!views"].push({ RTL: true });

    const today = new Date().toISOString().split("T")[0];
    writeFile(workbook, `طلبات_التواصل_${today}.xlsx`);
  };

  // Phone cleaner helper
  const cleanPhoneForWhatsApp = (phone: string) => {
    let cleanPhone = phone.replace(/[^0-9+]/g, "");
    if (cleanPhone.startsWith("01")) {
      cleanPhone = "2" + cleanPhone; // Egypt Code
    } else if (cleanPhone.startsWith("+")) {
      cleanPhone = cleanPhone.substring(1);
    }
    return cleanPhone;
  };

  const getStatusBadge = (status: string = "جديد") => {
    switch (status) {
      case "جديد":
        return (
          <span className="inline-flex items-center gap-1 bg-[#3e499e]/20 text-blue-300 text-xs px-2.5 py-1 rounded-full border border-[#3e499e]/30 font-bold">
            <AlertCircle className="w-3 h-3" />
            جديد
          </span>
        );
      case "تم التواصل":
        return (
          <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 text-xs px-2.5 py-1 rounded-full border border-blue-500/20 font-bold">
            <Clock className="w-3 h-3" />
            تم التواصل
          </span>
        );
      case "تم الحل":
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold">
            <CheckCircle2 className="w-3 h-3" />
            تم الحل
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-zinc-500/10 text-zinc-400 text-xs px-2.5 py-1 rounded-full border border-zinc-500/20 font-bold">
            جديد
          </span>
        );
    }
  };

  return (
    <div className="bg-zinc-950 min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-right text-white" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
              <span className="hover:text-white transition-colors cursor-pointer" onClick={onNavigateToDashboard}>لوحة التحكم</span>
              <span>/</span>
              <span className="text-blue-300 font-bold">طلبات التواصل العام</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
              <Mail className="w-8 h-8 text-[#3e499e]" />
              إدارة طلبات التواصل العام
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportExcel}
              disabled={filteredRequests.length === 0}
              className="inline-flex items-center gap-1.5 bg-[#3e499e]/20 hover:bg-[#3e499e]/30 border border-[#3e499e]/30 text-blue-300 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-300" />
              <span>تصدير Excel</span>
            </button>

            <button
              onClick={onNavigateToDashboard}
              className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة للرئيسية</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
          {/* Search */}
          <div className="md:col-span-7 relative">
            <Search className="absolute right-4 top-3.5 text-zinc-500 w-4 h-4" />
            <input
              type="text"
              placeholder="ابحث عن العميل، الهاتف، أو محتوى الرسالة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pr-11 pl-4 py-3 text-sm focus:outline-none focus:border-[#3e499e] focus:bg-zinc-900 transition-colors placeholder:text-zinc-500 text-right"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="md:col-span-5 flex gap-2">
            <div className="relative w-full">
              <Filter className="absolute right-4 top-3.5 text-zinc-500 w-4 h-4 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pr-11 pl-4 py-3 text-sm focus:outline-none focus:border-[#3e499e] focus:bg-zinc-900 transition-colors appearance-none text-right font-bold text-zinc-300"
              >
                <option value="all">كل الحالات</option>
                <option value="جديد">جديد</option>
                <option value="تم التواصل">تم التواصل</option>
                <option value="تم الحل">تم الحل</option>
              </select>
            </div>

            <button 
              onClick={fetchRequests} 
              className="p-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl transition-colors shrink-0"
              title="تحديث البيانات"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 12H19c0 .73-.18 1.42-.5 2m-.5 2l2 2m-2-2l-2 2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs leading-relaxed">
            {errorMsg}
          </div>
        )}

        {/* Requests List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-500">
            <Loader2 className="w-8 h-8 animate-spin text-[#3e499e]" />
            <span className="text-sm font-bold">جاري تحميل طلبات التواصل...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-zinc-900/40 rounded-3xl border border-zinc-850 py-16 text-center text-zinc-500 space-y-2">
            <Mail className="w-12 h-12 text-zinc-700 mx-auto" />
            <p className="font-extrabold text-zinc-400">لا توجد رسائل تواصل</p>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
              لم نجد أي طلبات تطابق معايير البحث أو الفلترة المحددة في النظام حالياً.
            </p>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-zinc-950/80 text-zinc-400 text-xs border-b border-zinc-800">
                    <th className="py-4 px-6 font-extrabold">العميل</th>
                    <th className="py-4 px-6 font-extrabold">رقم الهاتف</th>
                    <th className="py-4 px-6 font-extrabold">محتوى الرسالة</th>
                    <th className="py-4 px-6 font-extrabold">تاريخ الإرسال</th>
                    <th className="py-4 px-6 font-extrabold text-center">الحالة</th>
                    <th className="py-4 px-6 font-extrabold text-center">تغيير الحالة</th>
                    <th className="py-4 px-6 font-extrabold text-left">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredRequests.map((req) => {
                    const isNew = (req.status || "جديد") === "جديد";
                    return (
                      <tr 
                        key={req.id} 
                        className={`transition-colors border-r-4 ${
                          isNew 
                            ? "bg-[#3e499e]/[0.08] hover:bg-[#3e499e]/[0.12] border-r-[#3e499e]" 
                            : "hover:bg-zinc-850/40 border-r-transparent"
                        }`}
                      >
                        {/* Name */}
                        <td className="py-4 px-6">
                          <span className="font-extrabold text-zinc-100 block">{req.name}</span>
                        </td>
                        
                        {/* Phone */}
                        <td className="py-4 px-6 font-mono text-zinc-300" dir="ltr">
                          {req.phone}
                        </td>
                        
                        {/* Message Preview */}
                        <td className="py-4 px-6 text-zinc-300 max-w-xs truncate text-xs">
                          {req.message}
                        </td>
                        
                        {/* Date */}
                        <td className="py-4 px-6 text-zinc-400 text-xs">
                          {new Date(req.created_at).toLocaleDateString("ar-EG", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                        
                        {/* Status Badge */}
                        <td className="py-4 px-6 text-center">
                          {getStatusBadge(req.status)}
                        </td>
                        
                        {/* Quick Status Dropdown */}
                        <td className="py-4 px-6 text-center">
                          <select
                            disabled={updatingId === req.id}
                            value={req.status || "جديد"}
                            onChange={(e) => handleUpdateStatus(req.id, e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 text-[11px] font-bold py-1.5 px-2 rounded-lg text-zinc-300 focus:outline-none focus:border-[#3e499e] disabled:opacity-50"
                          >
                            <option value="جديد">جديد</option>
                            <option value="تم التواصل">تم التواصل</option>
                            <option value="تم الحل">تم الحل</option>
                          </select>
                        </td>
                        
                        {/* Actions */}
                        <td className="py-4 px-6 text-left">
                          <div className="inline-flex items-center gap-2">
                            {/* Details Button */}
                            <button
                              onClick={() => setSelectedRequest(req)}
                              className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="عرض الرسالة بالكامل"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* WhatsApp Button */}
                            <button
                              onClick={() => {
                                const cleanPhone = cleanPhoneForWhatsApp(req.phone);
                                setPickerData({
                                  phone: cleanPhone,
                                  name: req.name,
                                  message: `مرحبًا ${req.name}، بخصوص طلب التواصل الذي أرسلته لنا عبر موقع الصفوة...`,
                                  title: `متابعة طلب التواصل مع ${req.name}`,
                                  subtitle: "اختر القناة المعتمدة للتواصل المباشر مع هذا العميل لمتابعة طلبه"
                                });
                              }}
                              className="p-2 bg-[#3e499e]/20 hover:bg-[#3e499e] text-blue-300 hover:text-white rounded-lg transition-colors cursor-pointer inline-block"
                              title="تواصل مع العميل"
                            >
                              <MessageCircle className="w-4 h-4 fill-current" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              
              {/* Header */}
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-[#3e499e]/20 p-2 rounded-xl text-blue-300">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base">تفاصيل طلب التواصل</h3>
                    <p className="text-[11px] text-zinc-400">كود الرسالة: {selectedRequest.id.substring(0, 8)}</p>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 text-right">
                
                {/* Visual Status Header */}
                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-bold">حالة المتابعة</span>
                  <div>
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                </div>

                {/* Details list */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/40 space-y-1">
                    <span className="text-[10px] text-zinc-500 block">اسم العميل</span>
                    <span className="text-sm font-extrabold text-zinc-150 block">{selectedRequest.name}</span>
                  </div>

                  <div className="bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/40 space-y-1" dir="ltr">
                    <span className="text-[10px] text-zinc-500 block text-right">رقم الهاتف</span>
                    <span className="text-sm font-extrabold text-zinc-150 block text-right font-mono">{selectedRequest.phone}</span>
                  </div>
                </div>

                {/* Message block */}
                <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800 space-y-1.5">
                  <span className="text-xs text-zinc-500 font-bold block">محتوى الرسالة:</span>
                  <p className="text-sm text-zinc-200 leading-relaxed font-medium whitespace-pre-line">
                    {selectedRequest.message}
                  </p>
                </div>

                {/* Date of submission */}
                <div className="flex items-center gap-2 text-xs text-zinc-500 font-bold justify-start">
                  <Calendar className="w-4 h-4 text-zinc-600" />
                  <span>تاريخ إرسال الرسالة: {new Date(selectedRequest.created_at).toLocaleString("ar-EG")}</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-6 border-t border-zinc-800 bg-zinc-950/40 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    const cleanPhone = cleanPhoneForWhatsApp(selectedRequest.phone);
                    setPickerData({
                      phone: cleanPhone,
                      name: selectedRequest.name,
                      message: `مرحبًا ${selectedRequest.name}، بخصوص طلب التواصل الذي أرسلته لنا عبر موقع الصفوة...`,
                      title: `متابعة طلب التواصل مع ${selectedRequest.name}`,
                      subtitle: "اختر القناة المعتمدة للتواصل المباشر مع هذا العميل لمتابعة طلبه"
                    });
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#3e499e] hover:bg-[#323a7e] text-white font-extrabold py-3.5 rounded-xl text-xs transition-colors cursor-pointer shadow-md"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>تواصل للمتابعة</span>
                </button>

                <button
                  onClick={() => setSelectedRequest(null)}
                  className="w-full bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-bold py-3.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  إغلاق التفاصيل
                </button>
              </div>

            </div>
          </div>
        )}

      </div>

      {pickerData && (
        <ContactMethodPicker
          isOpen={pickerData !== null}
          onClose={() => setPickerData(null)}
          title={pickerData.title}
          subtitle={pickerData.subtitle}
          customMessage={pickerData.message}
          customSubject="متابعة طلب التواصل - شركة الصفوة"
          recipientPhone={pickerData.phone}
          showEmailOption={false}
        />
      )}
    </div>
  );
}
