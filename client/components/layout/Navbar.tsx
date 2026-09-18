import { useQuery } from '@tanstack/react-query';
import NavbarButtonLogout from '#components/commons/NavbarButtonLogout';
import NavbarButtonMenu from '#components/commons/NavbarButtonMenu';
import NavbarButtonPreferences from '#components/commons/NavbarButtonPreferences';
import { Link } from 'wouter';

export default function Navbar() {
  const system = useQuery({
    queryKey: ['public-system'],
    queryFn: async () => {
      const response = await fetch('/api/public/system');
      if (!response.ok) {
        throw new Error('Could not load system');
      }

      return (await response.json()) as PublicSystemResponse;
    },
  });
  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="navbar-start">
        <Link to="/" className="btn btn-ghost text-xl">
          {system.data?.system.name ?? import.meta.env.DEFAULT_SYSTEM_NAME}
        </Link>
      </div>
      <div className="navbar-end gap-2">
        <NavbarButtonPreferences />
        <NavbarButtonLogout />
        <NavbarButtonMenu />
      </div>
    </div>
  );
}
