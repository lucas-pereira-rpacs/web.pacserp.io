import Icon from '#components/elements/Icon';

export default function NavbarButtonMenu() {
  return (
    <label
      htmlFor="drawer"
      tabIndex={0}
      role="button"
      aria-label="Menu"
      className="btn btn-ghost btn-circle drawer-button"
    >
      <Icon className="fa-solid fa-bars transition-transform is-drawer-open:rotate-180" />
    </label>
  );
}
