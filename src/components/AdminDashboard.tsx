import React, { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";
import { 
  FolderTree, 
  Boxes, 
  Mail, 
  Wrench, 
  Award,
  Activity,
  User,
  Clock
} from "lucide-react";

interface AdminDashboardProps {
  session: any;
  onLogout: () => void;
  onNavigateToHome: () => void;
  onNavigateToCategories: () => void;
  onNavigateToProducts: () => void;
  onNavigateToMaintenanceRequests: () => void;
  onNavigateToContactRequests: () => void;
  onNavigateToContent: () => void;
  onNavigateToBrands: () => void;
  categoriesCount: number;
  productsCount: number;
  brandsCount: number;
}

export default function AdminDashboard({
  session,
  categoriesCount,
  productsCount,
  brandsCount,
}: AdminDashboardProps) {
  const [contactsCount, setContactsCount] = useState(0);
  const [maintenancesCount, setMaintenancesCount] = useState(0);
  const [unseenMaintenanceCount, setUnseenMaintenanceCount] = useState(0);

  useEffect(() => {
    // Fetch counts for contacts and maintenance requests
    const fetchCounts = async () => {
      const supabase = getSupabase();
      
      // Baselining local storage counts
      let localContactsCount = 0;
      let localMaintenancesCount = 0;
      let localUnseenMaintCount = 0;

      try {
        const storedContacts = localStorage.getItem("electrocore_contact_requests");
        if (storedContacts) {
          localContactsCount = JSON.parse(storedContacts).length;
        }
      } catch (e) {
        console.error(e);
      }

      try {
        const storedMaint = localStorage.getItem("safwa_maintenance_requests");
        if (storedMaint) {
          const parsed = JSON.parse(storedMaint);
          localMaintenancesCount = parsed.length;
          localUnseenMaintCount = parsed.filter((r: any) => !r.is_seen).length;
        }
      } catch (e) {
        console.error(e);
      }

      setContactsCount(localContactsCount);
      setMaintenancesCount(localMaintenancesCount);
      setUnseenMaintenanceCount(localUnseenMaintCount);

      if (!supabase) return;

      try {
        const { count: contactCount } = await supabase
          .from("contact_requests")
          .select("*", { count: "exact", head: true });
        
        if (contactCount !== null) setContactsCount(contactCount);

        const { count: maintCount } = await supabase
          .from("maintenance_requests")
          .select("*", { count: "exact", head: true });

        if (maintCount !== null) setMaintenancesCount(maintCount);

        const { count: unseenCount, error: unseenErr } = await supabase
          .from("maintenance_requests")
          .select("*", { count: "exact", head: true })
          .not("is_seen", "eq", true);

        if (unseenCount !== null && !unseenErr) {
          setUnseenMaintenanceCount(unseenCount);
        }
      } catch (err) {
        console.error("Error fetching admin stats from Supabase:", err);
      }
    };

    fetchCounts();
  }, []);

  return (
    <div className="bg-zinc-950 min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-right text-white" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Welcome Section Banner */}
        <div className="bg-gradient-to-l from-zinc-900 to-zinc-950 border border-zinc-850 p-6 sm:p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">👋</span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">مرحباً بك في لوحة تحكم الكتالوج</h1>
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              يسعدنا تواجدك، يا <span className="text-amber-400 font-extrabold">{session?.user?.email}</span>. استخدم القائمة الجانبية للتنقل وتحديث محتوى الكتالوج، وإدارة الأقسام والمنتجات، ومتابعة طلبات الصيانة وتواصل عملائك بكل سلاسة ويسر.
            </p>
            <div className="flex items-center gap-4 text-zinc-500 text-[11px] font-bold pt-2 border-t border-zinc-900">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-amber-500" />
                <span>الرتبة: مدير محتوى الكتالوج</span>
              </span>
              <span className="h-3 w-px bg-zinc-800" />
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>المنطقة الزمنية: UTC</span>
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard Stat Cards */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-4 h-4 text-amber-500" />
            <h2 className="text-base font-black text-zinc-200">ملخص سريع لإحصائيات المنصة</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Stat Item 1: Categories */}
            <div className="bg-zinc-900/60 border border-zinc-900 p-6 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="block text-zinc-400 text-xs font-bold">عدد الأقسام</span>
                <span className="block text-3xl font-black font-mono text-white">{categoriesCount}</span>
              </div>
              <div className="bg-amber-500/10 text-amber-500 p-3 rounded-xl border border-amber-500/15">
                <FolderTree className="w-6 h-6" />
              </div>
            </div>

            {/* Stat Item 2: Products */}
            <div className="bg-zinc-900/60 border border-zinc-900 p-6 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="block text-zinc-400 text-xs font-bold">عدد المنتجات</span>
                <span className="block text-3xl font-black font-mono text-white">{productsCount}</span>
              </div>
              <div className="bg-sky-500/10 text-sky-400 p-3 rounded-xl border border-sky-500/15">
                <Boxes className="w-6 h-6" />
              </div>
            </div>

            {/* Stat Item 3: Brands */}
            <div className="bg-zinc-900/60 border border-zinc-900 p-6 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="block text-zinc-400 text-xs font-bold">البراندات والشركاء</span>
                <span className="block text-3xl font-black font-mono text-white">{brandsCount}</span>
              </div>
              <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl border border-emerald-500/15">
                <Award className="w-6 h-6" />
              </div>
            </div>

            {/* Stat Item 4: Contact Requests */}
            <div className="bg-zinc-900/60 border border-zinc-900 p-6 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="block text-zinc-400 text-xs font-bold">طلبات التواصل</span>
                <span className="block text-3xl font-black font-mono text-white">{contactsCount}</span>
              </div>
              <div className="bg-indigo-500/10 text-indigo-400 p-3 rounded-xl border border-indigo-500/15">
                <Mail className="w-6 h-6" />
              </div>
            </div>

            {/* Stat Item 5: Maintenance Requests */}
            <div className="bg-zinc-900/60 border border-zinc-900 p-6 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="block text-zinc-400 text-xs font-bold">طلبات الصيانة الإجمالية</span>
                <span className="block text-3xl font-black font-mono text-white">{maintenancesCount}</span>
              </div>
              <div className="bg-purple-500/10 text-purple-400 p-3 rounded-xl border border-purple-500/15">
                <Wrench className="w-6 h-6" />
              </div>
            </div>

            {/* Stat Item 6: Unseen Maintenance */}
            <div className="bg-zinc-900/60 border border-zinc-900 p-6 rounded-2xl flex items-center justify-between relative overflow-hidden">
              {unseenMaintenanceCount > 0 && (
                <div className="absolute top-0 left-0 w-2 h-full bg-red-600 animate-pulse" />
              )}
              <div className="space-y-1">
                <span className="block text-zinc-400 text-xs font-bold">طلبات صيانة جديدة</span>
                <span className={`block text-3xl font-black font-mono ${unseenMaintenanceCount > 0 ? "text-red-500" : "text-zinc-500"}`}>
                  {unseenMaintenanceCount}
                </span>
              </div>
              <div className={`p-3 rounded-xl border ${
                unseenMaintenanceCount > 0 
                  ? "bg-red-500/10 text-red-400 border-red-500/15" 
                  : "bg-zinc-800 text-zinc-500 border-zinc-700/50"
              }`}>
                <Wrench className="w-6 h-6" />
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
