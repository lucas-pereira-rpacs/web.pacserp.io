import { useQuery } from '@tanstack/react-query';
import Drawer from '#components/layout/Drawer';
import i18n from '#locales/i18n';

export default function RouteHome() {
  let locale = 'en-US';
  if (i18n.resolvedLanguage === 'pt') {
    locale = 'pt-BR';
  }

  const today = new Date();
  const system = useQuery({
    queryKey: ['public-system'],
    queryFn: async () => {
      const response = await fetch('/api/public/system');
      if (!response.ok) {
        throw new Error('Could not load system');
      }

      return (await response.json()) as PublicSystemResponse;
    },
  });

  return (
    <Drawer>
      <main className="flex flex-col gap-3 p-3">
        <div className="p-6">
          <h1 className="text-3xl">
            <i className="fa-solid fa-satellite-dish me-4 text-4xl"></i>
            {i18n.t('homeDashboard', {
              name: system.data?.system.name ?? import.meta.env.DEFAULT_SYSTEM_NAME,
            })}
          </h1>
          <p className="mt-3">{i18n.t('homeDate', { date: today.toLocaleDateString(locale) })}</p>
        </div>
        <div className="p-6 bg-base-300 gap-3 grid rounded-2xl">
          <div>
            <p>
              <i className="fa-solid fa-compass me-4"></i>
              {i18n.t('explore')}
            </p>
            <p className="mt-3 text-base-content/70">{i18n.t('explorePlaceholder')}</p>
          </div>
        </div>
      </main>
    </Drawer>
  );
}
