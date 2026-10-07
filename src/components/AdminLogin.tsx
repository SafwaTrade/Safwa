import React, { useState, FormEvent } from "react";
import { getSupabase } from "../lib/supabase";
import { ShieldAlert, KeyRound, Mail, AlertCircle, Loader2, ArrowRight } from "lucide-react";

interface AdminLoginProps {
  onLoginSuccess: (session: any) => void;
  onNavigateToHome: () => void;
}

export default function AdminLogin({ onLoginSuccess, onNavigateToHome }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMsg(null);

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        if (data && data.session) {
          onLoginSuccess(data.session);
        } else {
          throw new Error("لم يتم إرجاع جلسة صالحة من خادم المصادقة.");
        }
      } catch (err: any) {
        console.error("Login error:", err);
        // Translate common Supabase Auth errors for client readability
        let friendlyMessage = err.message || "خطأ في تسجيل الدخول. يرجى التحقق من البريد الإلكتروني وكلمة المرور.";
        if (err.message === "Invalid login credentials") {
          friendlyMessage = "بيانات الدخول غير صحيحة. يرجى التأكد من البريد الإلكتروني وكلمة المرور الصحيحة للأدمن في Supabase Auth.";
        }
        setErrorMsg(friendlyMessage);
      }
    } else {
      setErrorMsg("عذراً، تعذر الاتصال بخادم قاعدة بيانات ومصادقة Supabase. يرجى التحقق من متغيرات البيئة.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-zinc-950 min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-right" dir="rtl">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Back button */}
        <div className="text-center mb-6">
          <button 
            onClick={onNavigateToHome}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة للموقع الرئيسي</span>
          </button>
        </div>

        <div className="flex justify-center mb-4">
          <div className="bg-amber-500/10 p-3 rounded-2xl text-amber-500 border border-amber-500/20 shadow-inner">
            <KeyRound className="w-8 h-8" />
          </div>
        </div>
        <h2 className="text-center text-2xl sm:text-3xl font-black text-white tracking-tight">
          لوحة تحكم الأدمن
        </h2>
        <p className="mt-2 text-center text-xs sm:text-sm text-zinc-400">
          سجل الدخول لإدارة الأقسام والمنتجات وتعديل محتوى الكتالوج
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900 py-8 px-4 border border-zinc-800 shadow-2xl sm:rounded-3xl sm:px-10">
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-xs font-bold text-zinc-300">
                البريد الإلكتروني للأدمن
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@safwa.com"
                  className="block w-full pr-10 pl-3 py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 focus:bg-zinc-950 transition-colors text-right"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-xs font-bold text-zinc-300">
                كلمة المرور
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pr-10 pl-3 py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 focus:bg-zinc-950 transition-colors text-right"
                  dir="ltr"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-black py-3.5 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري التحقق...</span>
                  </>
                ) : (
                  <span>تسجيل الدخول كأدمن</span>
                )}
              </button>
            </div>
          </form>

          {/* Test credentials helper */}
          <div className="mt-6 pt-5 border-t border-zinc-800/80">
            <div className="bg-amber-500/5 rounded-2xl p-4 border border-amber-500/10">
              <div className="flex gap-2 text-amber-500 mb-1.5">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-xs font-bold">مصادقة آمنة وحقيقية:</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                يتم الآن التحقق من الهوية وتسجيل الدخول مباشرة من خلال نظام <b>Supabase Authentication</b> لضمان أمان العمليات وتوافقها الكامل مع قواعد حماية البيانات (RLS Policies).
                <br />
                <span className="text-zinc-300 block mt-1">يرجى كتابة البريد الإلكتروني وكلمة المرور الخاصة بحساب الأدمن الذي قمت بإنشائه على Supabase.</span>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
