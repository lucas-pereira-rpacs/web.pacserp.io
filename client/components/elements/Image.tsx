import clsx from 'clsx';
import type { ImgHTMLAttributes } from 'react';

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
  alt: string;
}

export default function Image({ alt, className, ...props }: Props) {
  return <img alt={alt} className={clsx(className)} {...props} />;
}
