import type { FormEvent } from 'react';
import Button from '#components/elements/Button';
import Icon from '#components/elements/Icon';
import i18n from '#locales/i18n';

export default function NavbarButtonPreferences() {
  function open() {
    const dialog = document.getElementById('preferences-dialog');
    if (!(dialog instanceof HTMLDialogElement)) {
      return;
    }

    dialog.showModal();
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const language = formData.get('language');

    if (language !== 'en' && language !== 'pt') {
      return;
    }

    localStorage.setItem('language', language);
    window.location.reload();
  }

  return (
    <>
      <div className="tooltip tooltip-left" data-tip={i18n.t('preferences')}>
        <Button
          type="button"
          className="btn-ghost btn-circle"
          aria-label={i18n.t('preferences')}
          onClick={open}
        >
          <Icon className="fa-solid fa-gear" />
        </Button>
      </div>
      <dialog id="preferences-dialog" className="modal" aria-labelledby="preferences-dialog-title">
        <div className="modal-box">
          <form method="dialog">
            <Button
              type="submit"
              className="btn-sm btn-circle btn-ghost absolute top-2 right-2"
              aria-label={i18n.t('close')}
            >
              <Icon className="fa-solid fa-xmark" />
            </Button>
          </form>
          <h2 id="preferences-dialog-title" className="text-lg font-bold">
            {i18n.t('preferences')}
          </h2>
          <form className="mt-4 flex flex-col gap-4" onSubmit={save}>
            <label className="fieldset-label" htmlFor="preference-language">
              {i18n.t('language')}
            </label>
            <select
              id="preference-language"
              name="language"
              className="select select-primary w-full"
              defaultValue={i18n.resolvedLanguage}
            >
              <option value="en">{i18n.t('english')}</option>
              <option value="pt">{i18n.t('portuguese')}</option>
            </select>
            <div className="modal-action">
              <Button type="submit" className="btn-primary">
                {i18n.t('save')}
              </Button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button aria-label={i18n.t('close')}>{i18n.t('close')}</button>
        </form>
      </dialog>
    </>
  );
}
