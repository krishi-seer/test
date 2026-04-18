import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      voice_assistant: "Voice Assistant",
      // ... more
    }
  },
  hi: {
    translation: {
      voice_assistant: "आवाज़ सहायक",
    }
  },
  or: {
    translation: {
      voice_assistant: "ସ୍ୱର ସହାୟକ",
    }
  },
  mr: {
    translation: {
      voice_assistant: "आवाज सहाय्यक",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'hi',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
