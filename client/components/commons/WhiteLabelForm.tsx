import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';
import Button from '#components/elements/Button';
import i18n from '#locales/i18n';

type WhiteLabelFormData = {
  name: string;
  slogan: string;
};

const whiteLabelSchema = z.object({
  name: z.string().trim().min(1, i18n.t('systemNameRequired')),
  slogan: z.string().trim(),
});

export default function WhiteLabelForm({ system }: { system: System }) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WhiteLabelFormData>({
    resolver: zodResolver(whiteLabelSchema),
    mode: 'onChange',
    defaultValues: system,
  });

  async function submit(data: WhiteLabelFormData) {
    try {
      const response = await fetch('/api/system', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        toast.error(i18n.t('whitelabelUpdateFailed'));
        return;
      }

      const updated = (await response.json()) as PublicSystemResponse;
      queryClient.setQueryData<PublicSystemResponse>(['public-system'], updated);
      toast.success(i18n.t('whitelabelUpdated'));
    } catch {
      toast.error(i18n.t('serverUnreachable'));
    }
  }

  return (
    <form className="fieldset w-full max-w-xl gap-3" noValidate onSubmit={handleSubmit(submit)}>
      <label className="label" htmlFor="system-name">
        {i18n.t('systemName')}
      </label>
      <input id="system-name" className="input input-primary w-full" {...register('name')} />
      {errors.name && <p className="label text-error">{errors.name.message}</p>}

      <label className="label" htmlFor="system-slogan">
        {i18n.t('systemSlogan')}
      </label>
      <input id="system-slogan" className="input input-primary w-full" {...register('slogan')} />

      <Button
        type="submit"
        className="btn-primary mt-3 self-start"
        isLoading={isSubmitting}
        disabled={isSubmitting}
      >
        {i18n.t('save')}
      </Button>
    </form>
  );
}
