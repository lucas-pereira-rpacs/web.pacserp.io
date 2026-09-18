import clsx from 'clsx';

interface Props extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export default function Label({ children, className, ...props }: Props) {
  return (
    <label className={clsx('label', className)} {...props}>
      {children}
    </label>
  );
}
