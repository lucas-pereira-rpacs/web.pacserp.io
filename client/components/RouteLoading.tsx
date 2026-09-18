import Flex from '#components/elements/Flex';
import Icon from '#components/elements/Icon';

export default function RouteLoading() {
  return (
    <Flex as="main" className="h-screen items-center justify-center">
      <Icon className="loading loading-spinner text-9xl text-primary" />
    </Flex>
  );
}
