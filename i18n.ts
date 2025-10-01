import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpApi from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(initReactI18next)
  .use(HttpApi)
  .use(LanguageDetector)
  .init({
    fallbackLng: "en",
    supportedLngs: ["en", "hi", "or"],
    backend: {
      loadPath: "/locales/{{lng}}/common.json",
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "lng",
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;