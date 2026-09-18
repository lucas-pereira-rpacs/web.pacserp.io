import Icon from '#components/elements/Icon';

export default function NavbarButtonMenu() {
  return (
    <label
      htmlFor="drawer"
      tabIndex={0}
      role="button"
      aria-label="Menu"
      className="btn btn-ghost btn-circle drawer-button lg:hidden"
    >
      <Icon className="fa-solid fa-bars" />
    </label>
  );
}
