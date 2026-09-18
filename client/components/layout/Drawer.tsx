import { useState, type ChangeEvent, type ReactNode } from 'react';
import { Link } from 'wouter';
import { Permission } from '#enumerators/permission';
import MustHavePermissions from '#components/guards/MustHavePermissions';
import i18n from '#locales/i18n';
import Navbar from './Navbar';

const DRAWER_STORAGE_KEY = 'drawer-open';

function getStoredDrawerState() {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return localStorage.getItem(DRAWER_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

interface Props {
  children: ReactNode;
}
export default function Drawer({ children }: Props) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(getStoredDrawerState);

  function handleDrawerChange(event: ChangeEvent<HTMLInputElement>) {
    const nextIsDrawerOpen = event.target.checked;
    setIsDrawerOpen(nextIsDrawerOpen);

    try {
      localStorage.setItem(DRAWER_STORAGE_KEY, String(nextIsDrawerOpen));
    } catch {
      return;
    }
  }

  return (
    <div className="drawer lg:drawer-open">
      <input
        id="drawer"
        type="checkbox"
        className="drawer-toggle inline"
        checked={isDrawerOpen}
        onChange={handleDrawerChange}
      />
      <div className="drawer-content flex flex-col">
        <Navbar />
        {children}
      </div>
      <div className="drawer-side is-drawer-close:overflow-visible">
        <label htmlFor="drawer" aria-label="close sidebar" className="drawer-overlay"></label>
        <div className="flex min-h-full flex-col items-start bg-base-200 is-drawer-close:w-14 is-drawer-open:w-64">
          <ul className="menu w-full grow">
            <li>
              <Link
                href="/"
                className="is-drawer-close:tooltip is-drawer-close:tooltip-right"
                data-tip={i18n.t('home')}
              >
                <i aria-hidden="true" className="fa-solid fa-house size-4" />
                <span className="is-drawer-close:hidden">{i18n.t('home')}</span>
              </Link>
            </li>
            <MustHavePermissions permissions={[Permission.UsersRead]}>
              <li>
                <Link
                  href="/users"
                  className="is-drawer-close:tooltip is-drawer-close:tooltip-right"
                  data-tip={i18n.t('users')}
                >
                  <i aria-hidden="true" className="fa-solid fa-users size-4" />
                  <span className="is-drawer-close:hidden">{i18n.t('users')}</span>
                </Link>
              </li>
            </MustHavePermissions>
            <MustHavePermissions permissions={[Permission.RolesRead]}>
              <li>
                <Link
                  href="/roles"
                  className="is-drawer-close:tooltip is-drawer-close:tooltip-right"
                  data-tip={i18n.t('roles')}
                >
                  <i aria-hidden="true" className="fa-solid fa-user-shield size-4" />
                  <span className="is-drawer-close:hidden">{i18n.t('roles')}</span>
                </Link>
              </li>
            </MustHavePermissions>
            <MustHavePermissions permissions={[Permission.SystemUpdate]}>
              <li>
                <Link
                  href="/whitelabel"
                  className="is-drawer-close:tooltip is-drawer-close:tooltip-right"
                  data-tip={i18n.t('whitelabel')}
                >
                  <i aria-hidden="true" className="fa-solid fa-palette size-4" />
                  <span className="is-drawer-close:hidden">{i18n.t('whitelabel')}</span>
                </Link>
              </li>
            </MustHavePermissions>
          </ul>
        </div>
      </div>
    </div>
  );
}
