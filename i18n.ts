import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";

const i18nConfig = {
  lng: "en",
  fallbackLng: "en",
  supportedLngs: ["en", "hi", "or"],
  debug: false,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
  backend: {
    loadPath: "/locales/{{lng}}/common.json",
  },
};

if (!i18n.isInitialized) {
  i18n
    .use(Backend)
    .use(initReactI18next)
    .init(i18nConfig);
}

export default i18n;