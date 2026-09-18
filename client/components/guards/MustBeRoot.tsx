import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

type Props = {
  children: ReactNode;
};

export default function MustBeRoot({ children }: Props) {
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

  if (!profile.data.user.roles.includes('root')) {
    return null;
  }

  return children;
}
