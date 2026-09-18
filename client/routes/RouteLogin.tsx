import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link } from 'wouter';
import toast from 'react-hot-toast';

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

type LoginFormData = {
  email: string;
  password: string;
};

export default function RouteLogin() {
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
  const loginSchema = z.object({
    email: z.email(i18n.t('invalidEmail')),
    password: z.string().min(1, i18n.t('passwordRequired')),
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  async function submit(data: LoginFormData) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'same-origin',
      });

      if (response.status === 403) {
        toast.error(i18n.t('verifyEmail'));
        return;
      }

      if (!response.ok) {
        toast.error(i18n.t('invalidCredentials'));
        return;
      }

      window.location.assign('/');
    } catch {
      toast.error(i18n.t('serverUnreachable'));
    }
  }

  let submitAriaLabel: string | undefined;
  if (isSubmitting) {
    submitAriaLabel = i18n.t('loggingIn');
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
          <Label htmlFor="email">{i18n.t('email')}</Label>
          <Input
            type="email"
            id="email"
            className="input-primary w-full"
            autoComplete="email"
            {...register('email')}
          />
          {errors.email && <Text className="label text-error">{errors.email.message}</Text>}
          <Label htmlFor="password">{i18n.t('password')}</Label>
          <Input
            type="password"
            id="password"
            className="input-primary w-full"
            autoComplete="current-password"
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
            {i18n.t('login')}
          </Button>
        </Form>
        <Link href="/register">
          {i18n.t('dontHaveAccount')}
          <Text as="span" className="link link-primary">
            {' '}
            {i18n.t('register')}
          </Text>
        </Link>
      </Flex>
    </Flex>
  );
}
