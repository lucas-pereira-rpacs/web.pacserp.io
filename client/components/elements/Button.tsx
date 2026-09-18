import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  isLoading?: boolean;
}

export default function Button({ children, className, isLoading = false, ...props }: Props) {
  let content = children;

  if (isLoading) {
    content = <i aria-hidden="true" className="loading loading-spinner" />;
  }

  return (
    <button className={clsx('btn', { 'pointer-events-none': isLoading }, className)} {...props}>
      {content}
    </button>
  );
}
