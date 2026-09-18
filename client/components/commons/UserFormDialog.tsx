import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';
import Button from '#components/elements/Button';
import Form from '#components/elements/Form';
import Input from '#components/elements/Input';
import Label from '#components/elements/Label';
import Text from '#components/elements/Text';
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
        <Text as="h2" className="mb-4 text-xl font-bold">
          {formTitle}
        </Text>
        <Form className="gap-3" noValidate onSubmit={handleSubmit(submit)}>
          <Label htmlFor="user-full-name">{i18n.t('fullName')}</Label>
          <Input id="user-full-name" className="input-primary w-full" {...register('fullName')} />
          {errors.fullName && <Text className="label text-error">{errors.fullName.message}</Text>}

          <Label htmlFor="user-phone-number">{i18n.t('phoneNumber')}</Label>
          <Input
            type="tel"
            id="user-phone-number"
            className="input-primary w-full"
            autoComplete="tel"
            maxLength={50}
            {...register('phoneNumber')}
          />
          {errors.phoneNumber && (
            <Text className="label text-error">{errors.phoneNumber.message}</Text>
          )}

          <Label htmlFor="user-email">{i18n.t('email')}</Label>
          <Input
            type="email"
            id="user-email"
            className="input-primary w-full"
            {...register('email')}
          />
          {errors.email && <Text className="label text-error">{errors.email.message}</Text>}

          <Label htmlFor="user-password">{i18n.t('password')}</Label>
          <Input
            type="password"
            id="user-password"
            className="input-primary w-full"
            autoComplete="new-password"
            placeholder={passwordPlaceholder}
            {...register('password')}
          />
          {errors.password && <Text className="label text-error">{errors.password.message}</Text>}

          <Text className="label">{i18n.t('roles')}</Text>
          {roles
            .filter((role) => isRoot || role.name !== 'root')
            .map((role) => (
              <Label key={role.id} className="cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  value={role.name}
                  {...register('roles')}
                />
                {role.name}
              </Label>
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
        </Form>
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
