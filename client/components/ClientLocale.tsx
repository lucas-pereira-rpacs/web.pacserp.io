import { useEffect, useState, type ReactNode } from 'react';
import i18n, { getPreferredLocale } from '#locales/i18n.client';

export default function ClientLocale({ children }: { children: ReactNode }) {
  const [, setLocaleRevision] = useState(0);

  useEffect(() => {
    const preferredLocale = getPreferredLocale();
    if (preferredLocale === i18n.resolvedLanguage) {
      return;
    }

    void i18n.changeLanguage(preferredLocale).then(() => {
      setLocaleRevision((revision) => revision + 1);
    });
  }, []);

  return children;
}
