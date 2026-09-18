import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link } from 'wouter';
import { z } from 'zod';
import Block from '#components/elements/Block';
import Button from '#components/elements/Button';
import Flex from '#components/elements/Flex';
import Form from '#components/elements/Form';
import Input from '#components/elements/Input';
import Label from '#components/elements/Label';
import Text from '#components/elements/Text';
import i18n from '#locales/i18n';
import Image from '#components/elements/Image';

type RegisterFormData = {
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
};

type RegisterResponse = {
  emailVerificationRequired: boolean;
  user: PublicUser;
};

export default function RouteRegister() {
  const system = useQuery({
    queryKey: ['public-system'],
    queryFn: async () => {
      const response = await fetch('/api/public/system');
      if (!response.ok) {
        throw new Error('Could not load system');
      }

      return (await response.json()) as PublicSystemResponse;
    },
  });
  const registerSchema = z.object({
    fullName: z.string().trim().min(1, i18n.t('fullNameRequired')),
    phoneNumber: z.string().trim().max(50, i18n.t('phoneNumberMaxLength')),
    email: z.email(i18n.t('invalidEmail')),
    password: z
      .string()
      .min(8, i18n.t('passwordMinLength'))
      .regex(/[A-Z]/, i18n.t('passwordUppercase'))
      .regex(/[a-z]/, i18n.t('passwordLowercase'))
      .regex(/\d/, i18n.t('passwordNumber')),
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: { phoneNumber: '' },
  });

  async function submit(data: RegisterFormData) {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ ...data, locale: i18n.language }),
      });

      if (!response.ok && response.status === 409) {
        toast.error(i18n.t('existingAccount'));
        return;
      }

      if (!response.ok) {
        toast.error(i18n.t('accountCreationFailed'));
        return;
      }

      const created = (await response.json()) as RegisterResponse;

      if (created.emailVerificationRequired) {
        toast.success(i18n.t('verifyEmail'));
        return;
      }

      toast.success(i18n.t('accountCreated'));
    } catch {
      toast.error(i18n.t('serverUnreachable'));
    }
  }

  let submitAriaLabel: string | undefined;
  if (isSubmitting) {
    submitAriaLabel = i18n.t('register');
  }

  return (
    <Flex as="main" className="h-screen">
      <Block className="basis-1/2 hidden lg:block">
        <img
          src="/api/public/system/storage/placeholder"
          alt={i18n.t('laboratoryAlt')}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </Block>

      <Flex className="basis-1/2 grow flex-col items-center place-content-center gap-3">
        <Image
          src="/api/public/system/storage/logo"
          alt={i18n.t('logoAlt')}
          width="92px"
          loading="lazy"
        />
        <Text as="h1" className="text-2xl font-bold">
          {system.data?.system.name ?? import.meta.env.DEFAULT_SYSTEM_NAME}
        </Text>
        <Form className="p-3 w-xs gap-3" noValidate onSubmit={handleSubmit(submit)}>
          <Label htmlFor="full-name">{i18n.t('fullName')}</Label>
          <Input
            id="full-name"
            className="input-primary w-full"
            placeholder={i18n.t('fullNamePlaceholder')}
            autoComplete="name"
            {...register('fullName')}
          />
          {errors.fullName && <Text className="label text-error">{errors.fullName.message}</Text>}

          <Label htmlFor="phone-number">{i18n.t('phoneNumber')}</Label>
          <Input
            type="tel"
            id="phone-number"
            className="input-primary w-full"
            autoComplete="tel"
            maxLength={50}
            {...register('phoneNumber')}
          />
          {errors.phoneNumber && (
            <Text className="label text-error">{errors.phoneNumber.message}</Text>
          )}

          <Label htmlFor="email">{i18n.t('email')}</Label>
          <Input
            type="email"
            id="email"
            className="input-primary w-full"
            placeholder={i18n.t('emailPlaceholder')}
            autoComplete="email"
            {...register('email')}
          />
          {errors.email && <Text className="label text-error">{errors.email.message}</Text>}

          <Label htmlFor="password">{i18n.t('password')}</Label>
          <Input
            type="password"
            id="password"
            className="input-primary w-full"
            placeholder={i18n.t('passwordPlaceholder')}
            autoComplete="new-password"
            {...register('password')}
          />
          {errors.password && <Text className="label text-error">{errors.password.message}</Text>}

          <Button
            type="submit"
            className="btn-primary mt-3"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            aria-label={submitAriaLabel}
          >
            {i18n.t('register')}
          </Button>
        </Form>
        <Link href="/login">
          {i18n.t('alreadyHaveAccount')}
          <Text as="span" className="link link-primary">
            {' '}
            {i18n.t('login')}
          </Text>
        </Link>
      </Flex>
    </Flex>
  );
}
