import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Button from '#components/elements/Button';
import i18n from '#locales/i18n';

export default function NavbarButtonLogout() {
  const queryClient = useQueryClient();
  const logout = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Could not log out');
      }
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.assign('/login');
    },
    onError: () => {
      toast.error(i18n.t('logoutFailed'));
    },
  });

  return (
    <div className="tooltip tooltip-left" data-tip={i18n.t('logout')}>
      <Button
        type="button"
        className="btn-ghost btn-circle"
        aria-label={i18n.t('logout')}
        isLoading={logout.isPending}
        disabled={logout.isPending}
        onClick={() => logout.mutate()}
      >
        <i aria-hidden="true" className="fa-solid fa-right-from-bracket" />
      </Button>
    </div>
  );
}
