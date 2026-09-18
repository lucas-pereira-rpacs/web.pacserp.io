import clsx from 'clsx';
import { resolveValue, type Toast } from 'react-hot-toast';

type AlertProps = {
  toast: Toast;
};

export default function Alert({ toast }: AlertProps) {
  const className = clsx('alert', {
    'alert-success': toast.type === 'success',
    'alert-error': toast.type === 'error',
  });

  return (
    <div className={className} {...toast.ariaProps}>
      {toast.type === 'success' && <i aria-hidden="true" className="fa-solid fa-thumbs-up" />}
      {toast.type === 'error' && (
        <i aria-hidden="true" className="fa-solid fa-circle-exclamation" />
      )}
      <span>{resolveValue(toast.message, toast)}</span>
    </div>
  );
}
