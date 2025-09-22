"use client";

import { useEffect, useState } from "react";
import  Button  from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import i18nInstance from "@/i18n";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language);

  useEffect(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("lng") : null;
      const initial = saved || i18n.language || "or";
      if (i18n.language !== initial) {
        i18n.changeLanguage(initial);
      }
      setCurrentLang(initial);
    } catch {}
  }, [i18n]);

  const languages = [
    { code: "or", name: "ଓଡ଼ିଆ", flag: "🇮🇳" },
    { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
    { code: "en", name: "English", flag: "🇬🇧" },
  ];

  const handleLanguageChange = (lang: string) => {
    i18n?.changeLanguage?.(lang);
    try { localStorage.setItem("lng", lang); } catch {}
    setCurrentLang(lang);
  };

  return (
    <div className="flex items-center space-x-1 bg-gray-100 rounded-full p-1">
      {languages.map((lang) => (
        <Button
          key={lang.code}
          variant={currentLang === lang.code ? "default" : "outline"}
          onClick={() => handleLanguageChange(lang.code)}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-all ${
            currentLang === lang.code 
              ? "bg-green-600 text-white shadow-md" 
              : "text-gray-600 hover:bg-gray-200"
          }`}
        >
          {lang.flag} {lang.name}
        </Button>
      ))}
    </div>
  );
}