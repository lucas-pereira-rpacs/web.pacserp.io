import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';
import Button from '#components/elements/Button';
import { Feature, Features } from '#enumerators/feature';
import i18n from '#locales/i18n';

type SystemFeaturesFormData = {
  features: Feature[];
};

const systemFeaturesSchema = z.object({
  features: z.array(z.enum(Features)),
});

export default function SystemFeaturesForm({ system }: { system: System }) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SystemFeaturesFormData>({
    resolver: zodResolver(systemFeaturesSchema),
    mode: 'onChange',
    defaultValues: { features: system.features },
  });

  async function submit(data: SystemFeaturesFormData) {
    try {
      const response = await fetch('/api/system', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        toast.error(i18n.t('featuresUpdateFailed'));
        return;
      }

      const updated = (await response.json()) as PublicSystemResponse;
      queryClient.setQueryData<PublicSystemResponse>(['public-system'], updated);
      toast.success(i18n.t('featuresUpdated'));
    } catch {
      toast.error(i18n.t('serverUnreachable'));
    }
  }

  return (
    <form
      className="fieldset mt-8 w-full max-w-xl gap-3"
      noValidate
      onSubmit={handleSubmit(submit)}
    >
      <h2 className="text-xl font-bold">{i18n.t('features')}</h2>
      <div className="grid gap-3">
        <label htmlFor="feature-email" className="label cursor-pointer justify-start gap-3">
          <input
            id="feature-email"
            type="checkbox"
            className="checkbox checkbox-primary"
            value={Feature.Email}
            {...register('features')}
          />
          {i18n.t('feature.email')}
        </label>
      </div>

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
