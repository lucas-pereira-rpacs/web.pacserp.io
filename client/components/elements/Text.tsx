import clsx from 'clsx';
import type { ElementType, HTMLAttributes, ReactNode } from 'react';

interface Props extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  children: ReactNode;
}

export default function Text({ as: Component = 'p', children, className, ...props }: Props) {
  return (
    <Component className={clsx(className)} {...props}>
      {children}
    </Component>
  );
}
