import clsx from 'clsx';

interface Props extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

export default function Form({ children, className, ...props }: Props) {
  return (
    <form className={clsx('fieldset', className)} {...props}>
      {children}
    </form>
  );
}
