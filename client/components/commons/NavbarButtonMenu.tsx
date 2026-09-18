export default function NavbarButtonMenu() {
  return (
    <label
      htmlFor="drawer"
      tabIndex={0}
      role="button"
      aria-label="Menu"
      className="btn btn-ghost btn-circle drawer-button"
    >
      <i
        aria-hidden="true"
        className="fa-solid fa-bars transition-transform is-drawer-open:rotate-180"
      />
    </label>
  );
}
