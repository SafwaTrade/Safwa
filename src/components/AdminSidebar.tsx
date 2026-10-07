import React, { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";
import { 
  FolderTree, 
  Boxes, 
  Award, 
  Mail, 
  Wrench, 
  FileText, 
  SlidersHorizontal, 
  LogOut, 
  Globe, 
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Menu
} from "lucide-react";

interface AdminSidebarProps {
  currentView: string;
  onNavigate: (viewType: string) => void;
  onLogout: () => void;
  onNavigateToHome: () => void;
  userEmail?: string;
}

export default function AdminSidebar({
  currentView,
  onNavigate,
  onLogout,
  onNavigateToHome,
  userEmail
}: AdminSidebarProps) {
  const [unseenMaintenanceCount, setUnseenMaintenanceCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false); // For mobile sidebar responsiveness

  useEffect(() => {
    const fetchUnseenCount = async () => {
      const supabase = getSupabase();
      
      // Baselining local storage counts
      let localUnseenMaintCount = 0;
      try {
        const storedMaint = localStorage.getItem("safwa_maintenance_requests");
        if (storedMaint) {
          const parsed = JSON.parse(storedMaint);
          localUnseenMaintCount = parsed.filter((r: any) => !r.is_seen).length;
        }
      } catch (e) {
        console.error(e);
      }
      setUnseenMaintenanceCount(localUnseenMaintCount);

      if (!supabase) return;

      try {
        const { count: unseenCount, error: unseenErr } = await supabase
          .from("maintenance_requests")
          .select("*", { count: "exact", head: true })
          .not("is_seen", "eq", true);

        if (unseenCount !== null && !unseenErr) {
          setUnseenMaintenanceCount(unseenCount);
        }
      } catch (err) {
        console.error("Error fetching unseen maintenance requests count inside sidebar:", err);
      }
    };

    fetchUnseenCount();
    // Poll every 30 seconds to update badge in the sidebar dynamically
    const interval = setInterval(fetchUnseenCount, 30000);
    return () => clearInterval(interval);
  }, [currentView]);

  const navItems = [
    {
      group: "📦 الكتالوج",
      items: [
        { id: "admin-categories", label: "الأقسام", icon: FolderTree },
        { id: "admin-products", label: "المنتجات", icon: Boxes },
        { id: "admin-brands", label: "البراندات", icon: Award },
      ]
    },
    {
      group: "📩 الطلبات",
      items: [
        { id: "admin-contact", label: "طلبات التواصل", icon: Mail },
        { 
          id: "admin-maintenance", 
          label: "طلبات الصيانة والضمان", 
          icon: Wrench,
          badge: unseenMaintenanceCount > 0 ? unseenMaintenanceCount : undefined
        },
      ]
    },
    {
      group: "⚙️ المحتوى والإعدادات",
      items: [
        { id: "admin-content", label: "نصوص وصور الموقع", icon: FileText },
        { id: "admin-settings", label: "إعدادات الأقسام", icon: SlidersHorizontal },
      ]
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800 text-right select-none">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-2 mb-4 justify-start">
          <div className="bg-[#3e499e] text-white p-1.5 rounded-lg">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-sm text-zinc-100">لوحة الإدارة الفنية</h2>
            {userEmail && (
              <p className="text-[10px] text-zinc-500 font-bold max-w-[180px] truncate" title={userEmail}>
                {userEmail}
              </p>
            )}
          </div>
        </div>

        {/* Global sticky controls */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            onClick={onNavigateToHome}
            className="flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700/50 text-[11px] font-black py-2 px-3 rounded-lg text-zinc-300 transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>الموقع الرئيسي</span>
          </button>
          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-1.5 bg-red-950/40 hover:bg-red-900/30 border border-red-900/30 text-[11px] font-black py-2 px-3 rounded-lg text-red-400 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Dashboard Link */}
        <div className="space-y-1">
          <button
            onClick={() => {
              onNavigate("admin-dashboard");
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black transition-all ${
              currentView === "admin-dashboard"
                ? "bg-[#3e499e] text-white shadow-md font-bold"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">📊</span>
              <span>الملخص الترحيبي</span>
            </div>
            {currentView === "admin-dashboard" && <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {navItems.map((group, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className="text-[10px] font-black text-zinc-500 tracking-wider px-3 uppercase">
              {group.group}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#3e499e] text-white shadow-md font-extrabold"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-zinc-500"}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className={`inline-flex items-center justify-center text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse shrink-0 ${
                        isActive ? "bg-zinc-950 text-white" : "bg-red-600 text-white"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar to toggle sidebar */}
      <div className="md:hidden w-full bg-zinc-900 border-b border-zinc-850 py-3 px-4 flex items-center justify-between sticky top-0 z-50 text-white" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="bg-[#3e499e] text-white p-1 rounded-md">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <span className="font-black text-xs">لوحة التحكم الفنية</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-zinc-800 hover:bg-zinc-750 p-2 rounded-lg text-zinc-300 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-xs"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed md:sticky top-0 right-0 h-screen z-50 md:z-30 w-64 shrink-0 transition-transform duration-300 ease-in-out md:translate-x-0
        ${isOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}
      `}>
        {sidebarContent}
      </div>
    </>
  );
}
