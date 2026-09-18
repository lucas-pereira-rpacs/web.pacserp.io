import { useQuery } from '@tanstack/react-query';
import { Permission } from '#enumerators/permission';
import SystemFeaturesForm from '#components/commons/SystemFeaturesForm';
import WhiteLabelForm from '#components/commons/WhiteLabelForm';
import WhiteLabelFormStorage from '#components/commons/WhiteLabelFormStorage';
import Text from '#components/elements/Text';
import MustHavePermissions from '#components/guards/MustHavePermissions';
import Drawer from '#components/layout/Drawer';
import i18n from '#locales/i18n';

export default function RouteWhitelabel() {
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
    <MustHavePermissions permissions={[Permission.SystemUpdate]}>
      <Drawer>
        <main className="p-6">
          <Text as="h1" className="mb-6 text-2xl font-bold">
            {i18n.t('whitelabel')}
          </Text>
          {system.isError && <Text className="text-error">{i18n.t('systemLoadFailed')}</Text>}
          {system.data && <WhiteLabelForm system={system.data.system} />}
          {system.data && <SystemFeaturesForm system={system.data.system} />}
          <WhiteLabelFormStorage />
        </main>
      </Drawer>
    </MustHavePermissions>
  );
}
