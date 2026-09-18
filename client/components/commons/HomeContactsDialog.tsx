import { useEffect, useRef } from 'react';
import Button from '#components/elements/Button';
import i18n from '#locales/i18n';

interface Props {
  closeContacts: () => void;
  isError: boolean;
  isLoading: boolean;
  refetchUsers: () => void;
  users: ShiftUsersResponse['users'];
}

function PhoneNumberLink({ phoneNumber }: { phoneNumber?: string }) {
  if (!phoneNumber) {
    return <span className="text-base-content/50">-</span>;
  }

  return (
    <a className="link link-primary" href={'tel:' + phoneNumber}>
      {phoneNumber}
    </a>
  );
}

export default function HomeContactsDialog({
  closeContacts,
  isError,
  isLoading,
  refetchUsers,
  users,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    element?.showModal();
    return () => {
      element?.close();
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  const ready = !isLoading && !isError;

  return (
    <dialog
      ref={dialog}
      className="modal"
      aria-labelledby="home-contacts-title"
      onCancel={(event) => {
        event.preventDefault();
        closeContacts();
      }}
    >
      <div className="modal-box flex max-h-[90dvh] w-[96vw] max-w-4xl flex-col gap-4 p-4 sm:p-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 id="home-contacts-title" className="text-2xl font-bold">
              {i18n.t('homePhoneNumbers')}
            </h2>
            <p className="mt-1 text-sm text-base-content/60">{i18n.t('homeContactsHint')}</p>
          </div>
          <Button
            type="button"
            className="btn-circle btn-ghost btn-sm shrink-0"
            aria-label={i18n.t('close')}
            onClick={closeContacts}
          >
            <i aria-hidden="true" className="fa-solid fa-xmark" />
          </Button>
        </header>
        {isLoading && (
          <div className="flex min-h-48 items-center justify-center gap-3" role="status">
            <span className="loading loading-spinner loading-md" />
            {i18n.t('homeContactsLoading')}
          </div>
        )}
        {isError && (
          <div className="alert alert-error" role="alert">
            <span>{i18n.t('usersLoadFailed')}</span>
            <Button type="button" className="btn-sm" onClick={refetchUsers}>
              {i18n.t('homeCalendarRetry')}
            </Button>
          </div>
        )}
        {ready && users.length === 0 && (
          <div className="rounded-lg bg-base-200 p-4 text-center text-base-content/70">
            {i18n.t('homeContactsEmpty')}
          </div>
        )}
        {ready && users.length > 0 && (
          <div className="overflow-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>{i18n.t('fullName')}</th>
                  <th>{i18n.t('phoneNumber')}</th>
                  <th>{i18n.t('email')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="font-medium">{user.fullName}</td>
                    <td>
                      <PhoneNumberLink phoneNumber={user.phoneNumber} />
                    </td>
                    <td>
                      <a className="link link-primary" href={'mailto:' + user.email}>
                        {user.email}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <form
        method="dialog"
        className="modal-backdrop"
        onSubmit={(event) => {
          event.preventDefault();
          closeContacts();
        }}
      >
        <button type="submit">{i18n.t('close')}</button>
      </form>
    </dialog>
  );
}
