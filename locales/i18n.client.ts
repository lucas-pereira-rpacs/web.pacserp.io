import i18next from 'i18next';
import en from './en.json';
import pt from './pt.json';

export type SupportedLocale = 'en' | 'pt';

function normalizeLocale(locale: string | null | undefined): SupportedLocale {
  if (locale?.toLowerCase().startsWith('pt')) {
    return 'pt';
  }

  return 'en';
}

export function getPreferredLocale(): SupportedLocale {
  const storedLocale = localStorage.getItem('language');
  if (storedLocale) {
    return normalizeLocale(storedLocale);
  }

  return normalizeLocale(navigator.language);
}

const i18n = i18next.createInstance();

await i18n.init({
  lng: normalizeLocale(import.meta.env.DEFAULT_LOCALE),
  fallbackLng: 'en',
  supportedLngs: ['en', 'pt'],
  resources: {
    en: { translation: en },
    pt: { translation: pt },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
