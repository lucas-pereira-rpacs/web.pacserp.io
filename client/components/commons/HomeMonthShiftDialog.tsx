import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import themePlugin from '@fullcalendar/react/themes/monarch';
import ptBrLocale from '@fullcalendar/react/locales/pt-br';
import '@fullcalendar/react/skeleton.css';
import '@fullcalendar/react/themes/monarch/theme.css';
import './HomeMonthShiftDialog.css';
import Button from '#components/elements/Button';
import i18n from '#locales/i18n';

interface Props {
  closeCalendar: () => void;
}

export default function HomeMonthShiftDialog({ closeCalendar }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const shifts = useQuery({
    queryKey: ['shifts'],
    queryFn: async () => {
      const response = await fetch('/api/shifts');
      if (!response.ok) throw new Error('Could not load shifts');
      return (await response.json()) as ShiftsResponse;
    },
  });
  const users = useQuery({
    queryKey: ['shiftUsers'],
    queryFn: async () => {
      const response = await fetch('/api/shifts/users');
      if (!response.ok) throw new Error('Could not load shift users');
      return (await response.json()) as ShiftUsersResponse;
    },
  });

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    element?.showModal();
    return () => {
      element?.close();
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  const locale = i18n.resolvedLanguage ?? 'en';
  const userNames = new Map(users.data?.users.map((user) => [user.id, user.fullName]));
  const timeFormat = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' });
  const dateTimeFormat = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const ready = Boolean(shifts.data && users.data && !shifts.isError && !users.isError);
  const events = (shifts.data?.shifts ?? [])
    .filter((shift) => shift.status === 'scheduled')
    .map((shift) => {
      const start = new Date(shift.startAt);
      const end = new Date(shift.endAt);
      let startLabel = timeFormat.format(start);
      let endLabel = timeFormat.format(end);
      if (start.toDateString() !== end.toDateString()) {
        startLabel = dateTimeFormat.format(start);
        endLabel = dateTimeFormat.format(end);
      }
      return {
        id: shift.id,
        title: userNames.get(shift.userId) ?? i18n.t('shiftDeletedUser'),
        start: shift.startAt,
        end: shift.endAt,
        allDay: false,
        extendedProps: { timeLabel: startLabel + ' \u2013 ' + endLabel },
      };
    });

  return (
    <dialog
      ref={dialog}
      className="modal"
      aria-labelledby="home-month-title"
      onCancel={(event) => {
        event.preventDefault();
        closeCalendar();
      }}
    >
      <div className="modal-box flex max-h-[90dvh] w-[96vw] max-w-7xl flex-col gap-4 p-4 sm:p-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 id="home-month-title" className="text-2xl font-bold">
              {i18n.t('homeMonthCalendar')}
            </h2>
            <p className="mt-1 text-sm text-base-content/60">{i18n.t('homeMonthCalendarHint')}</p>
          </div>
          <Button
            type="button"
            className="btn-circle btn-ghost btn-sm shrink-0"
            aria-label={i18n.t('close')}
            onClick={closeCalendar}
          >
            <i aria-hidden="true" className="fa-solid fa-xmark" />
          </Button>
        </header>
        {(shifts.isLoading || users.isLoading) && (
          <div className="flex min-h-64 items-center justify-center gap-3" role="status">
            <span className="loading loading-spinner loading-md" />
            {i18n.t('homeCalendarLoading')}
          </div>
        )}
        {(shifts.isError || users.isError) && (
          <div className="alert alert-error" role="alert">
            <span>{i18n.t('shiftsLoadFailed')}</span>
            <Button
              type="button"
              className="btn-sm"
              onClick={() => {
                void shifts.refetch();
                void users.refetch();
              }}
            >
              {i18n.t('homeCalendarRetry')}
            </Button>
          </div>
        )}
        {ready && (
          <div
            className="home-shift-calendar min-h-0 overflow-auto"
            role="region"
            aria-label={i18n.t('homeMonthCalendar')}
            tabIndex={0}
          >
            <div className="min-w-[640px]">
              <FullCalendar
                plugins={[themePlugin, dayGridPlugin]}
                initialView="dayGridMonth"
                locales={[ptBrLocale]}
                locale={locale}
                timeZone="local"
                headerToolbar={{ start: 'title', end: 'today prev,next' }}
                buttons={{
                  today: { text: i18n.t('homeToday'), hint: i18n.t('homeToday') },
                  prev: { hint: i18n.t('homePreviousMonth') },
                  next: { hint: i18n.t('homeNextMonth') },
                }}
                height="auto"
                fixedWeekCount={false}
                nextDayThreshold="00:00:00"
                events={events}
                eventDisplay="block"
                eventOrder="start,title"
                editable={false}
                eventContent={(info) => (
                  <div
                    className="min-w-0 px-1 py-0.5"
                    title={info.event.title + ': ' + info.event.extendedProps.timeLabel}
                  >
                    <p className="break-words whitespace-normal text-xs font-semibold">
                      {info.event.title}
                    </p>
                    <p className="whitespace-normal text-xs opacity-80">
                      {info.event.extendedProps.timeLabel}
                    </p>
                  </div>
                )}
              />
            </div>
          </div>
        )}
        <p className="text-xs text-base-content/60">{i18n.t('shiftLocalTime')}</p>
      </div>
      <form
        method="dialog"
        className="modal-backdrop"
        onSubmit={(event) => {
          event.preventDefault();
          closeCalendar();
        }}
      >
        <button type="submit">{i18n.t('close')}</button>
      </form>
    </dialog>
  );
}
