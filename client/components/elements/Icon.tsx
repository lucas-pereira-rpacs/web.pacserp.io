import clsx from 'clsx';
import type { HTMLAttributes } from 'react';

interface Props extends HTMLAttributes<HTMLElement> {
  className: string;
}

export default function Icon({ className, ...props }: Props) {
  return <i aria-hidden="true" className={clsx(className)} {...props} />;
}
