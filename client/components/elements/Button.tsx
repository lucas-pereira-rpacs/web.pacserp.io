import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Icon from '#components/elements/Icon';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  isLoading?: boolean;
}

export default function Button({ children, className, isLoading = false, ...props }: Props) {
  let content = children;

  if (isLoading) {
    content = <Icon className="loading loading-spinner" />;
  }

  return (
    <button className={clsx('btn', { 'pointer-events-none': isLoading }, className)} {...props}>
      {content}
    </button>
  );
}
