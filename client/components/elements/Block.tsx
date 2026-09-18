import clsx from 'clsx';
import type { ElementType, HTMLAttributes, ReactNode } from 'react';

interface Props extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  children?: ReactNode;
}

export default function Block({ as: Component = 'div', children, className, ...props }: Props) {
  return (
    <Component className={clsx(className)} {...props}>
      {children}
    </Component>
  );
}
