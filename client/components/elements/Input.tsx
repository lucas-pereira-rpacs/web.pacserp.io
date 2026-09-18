import clsx from 'clsx';

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className, ...props }: Props) {
  return <input className={clsx('input', className)} {...props} />;
}
