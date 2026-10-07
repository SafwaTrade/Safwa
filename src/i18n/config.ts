import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { ar } from "./ar";
import { en } from "./en";

const SAVED_LANG_KEY = "safwa_lang";

const initialLanguage = (typeof window !== "undefined" && localStorage.getItem(SAVED_LANG_KEY)) || "ar";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      en: { translation: en },
    },
    lng: initialLanguage,
    fallbackLng: "ar",
    interpolation: {
      escapeValue: false, // react already escapes values
    },
  });

export const updateDocumentDirection = (lang: string) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }
};

// Apply initial direction
updateDocumentDirection(initialLanguage);

// Listener for language changes
i18n.on("languageChanged", (lng) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(SAVED_LANG_KEY, lng);
  }
  updateDocumentDirection(lng);
});

export default i18n;
