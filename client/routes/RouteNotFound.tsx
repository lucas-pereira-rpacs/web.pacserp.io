import { Link } from 'wouter';
import Button from '#components/elements/Button';
import i18n from '#locales/i18n';

export default function RouteNotFound() {
  function goBack() {
    window.history.back();
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-base-200 px-6 py-16">
      <div
        className="absolute -left-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-24 -right-24 size-72 rounded-full bg-secondary/10 blur-3xl"
        aria-hidden="true"
      />

      <section className="relative w-full max-w-xl text-center">
        <div className="mb-8 flex items-center justify-center gap-3" aria-hidden="true">
          <span className="text-8xl font-black tracking-tighter text-primary sm:text-9xl">4</span>
          <div className="grid size-20 place-items-center rounded-full border-8 border-primary/20 bg-base-100 shadow-xl sm:size-24">
            <svg
              className="size-9 text-primary sm:size-11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9.5 9.5h.01M14.5 9.5h.01" />
              <path d="M9 16c.8-1 1.8-1.5 3-1.5s2.2.5 3 1.5" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </div>
          <span className="text-8xl font-black tracking-tighter text-primary sm:text-9xl">4</span>
        </div>

        <p className="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-primary">
          {i18n.t('notFoundLabel')}
        </p>
        <h1 className="text-3xl font-bold text-base-content sm:text-4xl">
          {i18n.t('notFoundTitle')}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base-content/60">
          {i18n.t('notFoundDescription')}
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="btn btn-primary min-w-36">
            {i18n.t('goToHomepage')}
          </Link>
          <Button type="button" className="btn-ghost min-w-36" onClick={goBack}>
            {i18n.t('goBack')}
          </Button>
        </div>
      </section>
    </main>
  );
}
