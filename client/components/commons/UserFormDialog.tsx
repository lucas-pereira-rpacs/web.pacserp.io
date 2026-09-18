import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';
import Button from '#components/elements/Button';
import i18n from '#locales/i18n';

type UserFormData = {
  email: string;
  fullName: string;
  phoneNumber: string;
  password: string;
  roles: string[];
};

const userSchema = z.object({
  email: z.email(i18n.t('invalidEmail')),
  fullName: z.string().trim().min(1, i18n.t('fullNameRequired')),
  phoneNumber: z.string().trim().max(50, i18n.t('phoneNumberMaxLength')),
  password: z.string(),
  roles: z.array(z.string()),
});

interface Props {
  editingUser: UserProfile | null;
  closeForm: () => void;
  roles: PublicRole[];
  isRoot: boolean;
}

export default function UserFormDialog({ editingUser, closeForm, roles, isRoot }: Props) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    mode: 'onChange',
    defaultValues: { email: '', fullName: '', phoneNumber: '', password: '', roles: [] },
  });

  useEffect(() => {
    if (!editingUser) {
      reset({ email: '', fullName: '', phoneNumber: '', password: '', roles: [] });
      return;
    }

    reset({
      email: editingUser.email,
      fullName: editingUser.fullName,
      phoneNumber: editingUser.phoneNumber ?? '',
      password: '',
      roles: editingUser.roles,
    });
  }, [editingUser, reset]);

  async function submit(data: UserFormData) {
    if (!editingUser && data.password.length < 8) {
      setError('password', { message: i18n.t('passwordMinLength') });
      return;
    }
    if (editingUser && data.password && data.password.length < 8) {
      setError('password', { message: i18n.t('passwordMinLength') });
      return;
    }

    let url = '/api/users';
    let method = 'POST';
    if (editingUser) {
      url = `/api/users/${editingUser.id}`;
      method = 'PUT';
    }

    const requestData: Partial<UserFormData> = { ...data };
    if (editingUser && !data.password) {
      delete requestData.password;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(requestData),
      });
      if (response.status === 409) {
        setError('email', { message: i18n.t('existingAccount') });
        return;
      }
      if (!response.ok) {
        toast.error(i18n.t('userSaveFailed'));
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['users'] });
      closeForm();
      toast.success(i18n.t('userSaved'));
    } catch {
      toast.error(i18n.t('serverUnreachable'));
    }
  }

  let formTitle = i18n.t('newUser');
  let passwordPlaceholder = '';
  if (editingUser) {
    formTitle = i18n.t('editUser');
    passwordPlaceholder = i18n.t('leaveBlankPassword');
  }

  return (
    <div className="modal modal-open" role="dialog" aria-modal="true">
      <div className="modal-box">
        <h2 className="mb-4 text-xl font-bold">{formTitle}</h2>
        <form className="fieldset gap-3" noValidate onSubmit={handleSubmit(submit)}>
          <label className="label" htmlFor="user-full-name">
            {i18n.t('fullName')}
          </label>
          <input
            id="user-full-name"
            className="input input-primary w-full"
            {...register('fullName')}
          />
          {errors.fullName && <p className="label text-error">{errors.fullName.message}</p>}

          <label className="label" htmlFor="user-phone-number">
            {i18n.t('phoneNumber')}
          </label>
          <input
            type="tel"
            id="user-phone-number"
            className="input input-primary w-full"
            autoComplete="tel"
            maxLength={50}
            {...register('phoneNumber')}
          />
          {errors.phoneNumber && <p className="label text-error">{errors.phoneNumber.message}</p>}

          <label className="label" htmlFor="user-email">
            {i18n.t('email')}
          </label>
          <input
            type="email"
            id="user-email"
            className="input input-primary w-full"
            {...register('email')}
          />
          {errors.email && <p className="label text-error">{errors.email.message}</p>}

          <label className="label" htmlFor="user-password">
            {i18n.t('password')}
          </label>
          <input
            type="password"
            id="user-password"
            className="input input-primary w-full"
            autoComplete="new-password"
            placeholder={passwordPlaceholder}
            {...register('password')}
          />
          {errors.password && <p className="label text-error">{errors.password.message}</p>}

          <p className="label">{i18n.t('roles')}</p>
          {roles
            .filter((role) => isRoot || role.name !== 'root')
            .map((role) => (
              <label key={role.id} className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  value={role.name}
                  {...register('roles')}
                />
                {role.name}
              </label>
            ))}

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
