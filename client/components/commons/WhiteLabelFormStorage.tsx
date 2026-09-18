import { useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import Button from '#components/elements/Button';
import Form from '#components/elements/Form';
import Label from '#components/elements/Label';
import Text from '#components/elements/Text';
import i18n from '#locales/i18n';

export default function WhiteLabelFormStorage() {
  const [logo, setLogo] = useState<File>();
  const [placeholder, setPlaceholder] = useState<File>();
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingPlaceholder, setIsUploadingPlaceholder] = useState(false);
  const [logoVersion, setLogoVersion] = useState(0);
  const [placeholderVersion, setPlaceholderVersion] = useState(0);

  async function uploadLogo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!logo) {
      return;
    }

    setIsUploadingLogo(true);
    const body = new FormData();
    body.append('file', logo);

    try {
      const response = await fetch('/api/system/storage/logo', {
        method: 'PUT',
        credentials: 'same-origin',
        body,
      });

      if (!response.ok) {
        toast.error(i18n.t('logoUploadFailed'));
        return;
      }

      setLogo(undefined);
      setLogoVersion((version) => version + 1);
      form.reset();
      toast.success(i18n.t('logoUploaded'));
    } catch {
      toast.error(i18n.t('serverUnreachable'));
    } finally {
      setIsUploadingLogo(false);
    }
  }

  async function uploadPlaceholder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!placeholder) {
      return;
    }

    setIsUploadingPlaceholder(true);
    const body = new FormData();
    body.append('file', placeholder);

    try {
      const response = await fetch('/api/system/storage/placeholder', {
        method: 'PUT',
        credentials: 'same-origin',
        body,
      });

      if (!response.ok) {
        toast.error(i18n.t('placeholderUploadFailed'));
        return;
      }

      setPlaceholder(undefined);
      setPlaceholderVersion((version) => version + 1);
      form.reset();
      toast.success(i18n.t('placeholderUploaded'));
    } catch {
      toast.error(i18n.t('serverUnreachable'));
    } finally {
      setIsUploadingPlaceholder(false);
    }
  }

  return (
    <div className="mt-8 w-full max-w-xl space-y-6">
      <Text as="h2" className="text-xl font-bold">
        {i18n.t('images')}
      </Text>

      <div className="grid xl:grid-cols-2 gap-3">
        <Form className="gap-3" onSubmit={uploadLogo}>
          <Label htmlFor="system-logo">{i18n.t('logo')}</Label>
          <div className="flex h-40 items-center justify-center rounded-box border border-base-300 bg-base-200 p-6">
            <img
              src={`/api/public/system/storage/logo?v=${logoVersion}`}
              alt={i18n.t('logoAlt')}
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <input
            id="system-logo"
            className="file-input file-input-primary w-full"
            type="file"
            accept="image/*"
            onChange={(event) => setLogo(event.target.files?.[0])}
          />
          <Button
            type="submit"
            className="btn-primary self-start"
            isLoading={isUploadingLogo}
            disabled={!logo || isUploadingLogo}
          >
            {i18n.t('uploadLogo')}
          </Button>
        </Form>

        <Form className="gap-3" onSubmit={uploadPlaceholder}>
          <Label htmlFor="system-placeholder">{i18n.t('placeholder')}</Label>
          <div className="overflow-hidden rounded-box border border-base-300 bg-base-200">
            <img
              src={`/api/public/system/storage/placeholder?v=${placeholderVersion}`}
              alt={i18n.t('laboratoryAlt')}
              className="aspect-video w-full object-cover"
            />
          </div>
          <input
            id="system-placeholder"
            className="file-input file-input-primary w-full"
            type="file"
            accept="image/*"
            onChange={(event) => setPlaceholder(event.target.files?.[0])}
          />
          <Button
            type="submit"
            className="btn-primary self-start"
            isLoading={isUploadingPlaceholder}
            disabled={!placeholder || isUploadingPlaceholder}
          >
            {i18n.t('uploadPlaceholder')}
          </Button>
        </Form>
      </div>
    </div>
  );
}
