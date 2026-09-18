import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { Permission } from '#enumerators/permission';

type Props = {
  children: ReactNode;
  permissions: readonly Permission[];
};

export default function MustHavePermissions({ children, permissions }: Props) {
  const profile = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await fetch('/api/auth/profile');
      if (!response.ok) {
        throw new Error('Could not load profile');
      }

      return (await response.json()) as ProfileResponse;
    },
  });

  if (!profile.data) {
    return null;
  }

  if (profile.data.user.roles.includes('root')) {
    return children;
  }

  const hasPermissions = permissions.every((permission) =>
    profile.data.user.permissions.includes(permission),
  );
  if (!hasPermissions) {
    return null;
  }

  return children;
}
