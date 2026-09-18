import clsx from 'clsx';
import { resolveValue, type Toast } from 'react-hot-toast';
import Block from '#components/elements/Block';
import Icon from '#components/elements/Icon';
import Text from '#components/elements/Text';

type AlertProps = {
  toast: Toast;
};

export default function Alert({ toast }: AlertProps) {
  const className = clsx('alert', {
    'alert-success': toast.type === 'success',
    'alert-error': toast.type === 'error',
  });

  return (
    <Block className={className} {...toast.ariaProps}>
      {toast.type === 'success' && <Icon className="fa-solid fa-thumbs-up" />}
      {toast.type === 'error' && <Icon className="fa-solid fa-circle-exclamation" />}
      <Text as="span">{resolveValue(toast.message, toast)}</Text>
    </Block>
  );
}
