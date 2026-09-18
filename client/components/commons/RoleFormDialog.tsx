import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';
import Button from '#components/elements/Button';
import i18n from '#locales/i18n';

type RoleFormData = { name: string };

interface Props {
  editingRole: PublicRole | null;
  closeForm: () => void;
}

export default function RoleFormDialog({ editingRole, closeForm }: Props) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormData>({
    resolver: zodResolver(
      z.object({
        name: z
          .string()
          .trim()
          .min(1, i18n.t('roleNameRequired'))
          .max(50)
          .regex(/^[a-z0-9_-]+$/, i18n.t('roleNameInvalid')),
      }),
    ),
    mode: 'onChange',
    defaultValues: { name: '' },
  });

  useEffect(() => {
    reset({ name: editingRole?.name ?? '' });
  }, [editingRole, reset]);

  async function submit(data: RoleFormData) {
    let url = '/api/roles';
    let method = 'POST';
    if (editingRole) {
      url = `/api/roles/${editingRole.id}`;
      method = 'PUT';
    }
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.status === 409) {
        setError('name', { message: i18n.t('roleExists') });
        return;
      }
      if (!response.ok) {
        toast.error(i18n.t('roleSaveFailed'));
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['roles'] });
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await queryClient.invalidateQueries({ queryKey: ['rolePermissions'] });
      closeForm();
      toast.success(i18n.t('roleSaved'));
    } catch {
      toast.error(i18n.t('serverUnreachable'));
    }
  }

  let formTitle = i18n.t('newRole');
  if (editingRole) formTitle = i18n.t('editRole');

  return (
    <div className="modal modal-open" role="dialog" aria-modal="true">
      <div className="modal-box">
        <h2 className="mb-4 text-xl font-bold">{formTitle}</h2>
        <form className="fieldset gap-3" noValidate onSubmit={handleSubmit(submit)}>
          <label className="label" htmlFor="role-name">
            {i18n.t('roleName')}
          </label>
          <input id="role-name" className="input input-primary w-full" {...register('name')} />
          {errors.name && <p className="label text-error">{errors.name.message}</p>}
          <div className="modal-action">
            <Button type="button" className="btn-ghost" disabled={isSubmitting} onClick={closeForm}>
              {i18n.t('cancel')}
            </Button>
            <Button
              type="submit"
              className="btn-primary"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {i18n.t('save')}
            </Button>
          </div>
        </form>
      </div>
      <button
        type="button"
        className="modal-backdrop"
        aria-label={i18n.t('close')}
        onClick={closeForm}
      />
    </div>
  );
}
