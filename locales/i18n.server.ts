import i18next from 'i18next';
import en from './en.json';
import pt from './pt.json';

const runtime = globalThis as typeof globalThis & {
  process?: { env: Record<string, string | undefined> };
};
const i18n = i18next.createInstance();

await i18n.init({
  lng: runtime.process?.env.DEFAULT_LOCALE,
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
