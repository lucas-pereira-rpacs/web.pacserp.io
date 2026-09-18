import { Link } from 'wouter';
import { Permission } from '#enumerators/permission';
import Icon from '#components/elements/Icon';
import MustHavePermissions from '#components/guards/MustHavePermissions';
import i18n from '#locales/i18n';
import Navbar from './Navbar';

interface Props {
  children: React.ReactNode;
}
export default function Drawer({ children }: Props) {
  return (
    <div className="drawer lg:drawer-open">
      <input id="drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col">
        <Navbar />
        {children}
      </div>
      <div className="drawer-side">
        <label htmlFor="drawer" aria-label="close sidebar" className="drawer-overlay"></label>
        <ul className="menu bg-base-200 min-h-full  p-4">
          <li>
            <Link href="/">
              <Icon className="fa-solid fa-house" />
              {i18n.t('home')}
            </Link>
          </li>
          <MustHavePermissions permissions={[Permission.UsersRead]}>
            <li>
              <Link href="/users">
                <Icon className="fa-solid fa-users" />
                {i18n.t('users')}
              </Link>
            </li>
          </MustHavePermissions>
          <MustHavePermissions permissions={[Permission.RolesRead]}>
            <li>
              <Link href="/roles">
                <Icon className="fa-solid fa-user-shield" />
                {i18n.t('roles')}
              </Link>
            </li>
          </MustHavePermissions>
          <MustHavePermissions permissions={[Permission.SystemUpdate]}>
            <li>
              <Link href="/whitelabel">
                <Icon className="fa-solid fa-palette" />
                {i18n.t('whitelabel')}
              </Link>
            </li>
          </MustHavePermissions>
        </ul>
      </div>
    </div>
  );
}
