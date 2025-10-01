"use client";

import Button from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const languages = [
    { code: "or", name: "ଓଡ଼ିଆ", flag: "🇮🇳" },
    { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
    { code: "en", name: "English", flag: "🇬🇧" },
  ];

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="flex items-center space-x-1 bg-gray-100 rounded-full p-1">
      {languages.map((lang) => (
        <Button
          key={lang.code}
          variant={i18n.language === lang.code ? "default" : "outline"}
          onClick={() => handleLanguageChange(lang.code)}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-all ${
            i18n.language === lang.code
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