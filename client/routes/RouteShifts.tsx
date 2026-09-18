import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import interactionPlugin from '@fullcalendar/react/interaction';
import themePlugin from '@fullcalendar/react/themes/monarch';
import ptBrLocale from '@fullcalendar/react/locales/pt-br';
import toast from 'react-hot-toast';
import '@fullcalendar/react/skeleton.css';
import '@fullcalendar/react/themes/monarch/theme.css';
import '../components/commons/HomeMonthShiftDialog.css';
import { Permission } from '#enumerators/permission';
import ShiftFormDialog from '#components/commons/ShiftFormDialog';
import Button from '#components/elements/Button';
import MustHavePermissions from '#components/guards/MustHavePermissions';
import Drawer from '#components/layout/Drawer';
import i18n from '#locales/i18n';

export default function RouteShifts() {
  return (
    <MustHavePermissions permissions={[Permission.ShiftsRead]}>
      <ShiftList />
    </MustHavePermissions>
  );
}

function ShiftList() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingShift, setEditingShift] = useState<PublicShift | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [initialStartAt, setInitialStartAt] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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

  function closeForm() {
    setFormOpen(false);
    setEditingShift(null);
    setInitialStartAt(null);
  }

  function openNewShift(startAt?: string) {
    setEditingShift(null);
    setInitialStartAt(startAt ?? null);
    setFormOpen(true);
  }

  async function remove(shift: PublicShift) {
    if (deletingId) return;
    if (!window.confirm(i18n.t('deleteShiftConfirm'))) return;
    setDeletingId(shift.id);
    try {
      const response = await fetch(`/api/shifts/${shift.id}`, { method: 'DELETE' });
      if (!response.ok) {
        toast.error(i18n.t('shiftDeleteFailed'));
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success(i18n.t('shiftDeleted'));
    } catch {
      toast.error(i18n.t('serverUnreachable'));
    } finally {
      setDeletingId(null);
    }
  }

  const totalRows = shifts.data?.shifts.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleRows = shifts.data?.shifts.slice(startIndex, startIndex + pageSize) ?? [];
  let firstRow = 0;
  if (totalRows > 0) firstRow = startIndex + 1;
  if (shifts.data && page !== currentPage) setPage(currentPage);
  const userNames = new Map(users.data?.users.map((user) => [user.id, user.fullName]));
  const statusLabels = {
    scheduled: i18n.t('shiftScheduled'),
    completed: i18n.t('shiftCompleted'),
    cancelled: i18n.t('shiftCancelled'),
  };

  return (
    <Drawer>
      <main className="p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">{i18n.t('shifts')}</h1>
          <div className="flex flex-wrap justify-end gap-2">
            <MustHavePermissions permissions={[Permission.ShiftsCreate]}>
              <Button
                type="button"
                className="btn-ghost"
                disabled={!users.data?.users.length}
                onClick={() => setCalendarOpen(true)}
              >
                <i aria-hidden="true" className="fa-solid fa-calendar-days" />
                {i18n.t('homeMonthCalendar')}
              </Button>
            </MustHavePermissions>
            <MustHavePermissions permissions={[Permission.ShiftsCreate]}>
              <Button
                type="button"
                className="btn-primary"
                disabled={!users.data?.users.length}
                onClick={() => openNewShift()}
              >
                <i aria-hidden="true" className="fa-solid fa-plus" />
                {i18n.t('newShift')}
              </Button>
            </MustHavePermissions>
          </div>
        </div>
        {(shifts.isLoading || users.isLoading) && (
          <span className="loading loading-spinner loading-md" />
        )}
        {(shifts.isError || users.isError) && (
          <p className="text-error">{i18n.t('shiftsLoadFailed')}</p>
        )}
        {shifts.data && users.data && (
          <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
            <table className="table">
              <thead>
                <tr>
                  <th>{i18n.t('shiftUser')}</th>
                  <th>{i18n.t('shiftStart')}</th>
                  <th>{i18n.t('shiftEnd')}</th>
                  <th>{i18n.t('shiftStatus')}</th>
                  <th className="text-right">{i18n.t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center">
                      {i18n.t('noShifts')}
                    </td>
                  </tr>
                )}
                {visibleRows.map((shift) => (
                  <tr key={shift.id}>
                    <td className="font-medium">
                      {userNames.get(shift.userId) ?? i18n.t('shiftDeletedUser')}
                    </td>
                    <td>{new Date(shift.startAt).toLocaleString(i18n.language)}</td>
                    <td>{new Date(shift.endAt).toLocaleString(i18n.language)}</td>
                    <td>
                      <span className="badge badge-outline">{statusLabels[shift.status]}</span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <MustHavePermissions permissions={[Permission.ShiftsUpdate]}>
                          <Button
                            type="button"
                            className="btn-ghost btn-sm"
                            aria-label={i18n.t('editShift')}
                            onClick={() => {
                              setEditingShift(shift);
                              setFormOpen(true);
                            }}
                          >
                            <i aria-hidden="true" className="fa-solid fa-pen" />
                          </Button>
                        </MustHavePermissions>
                        <MustHavePermissions permissions={[Permission.ShiftsDelete]}>
                          <Button
                            type="button"
                            className="btn-ghost btn-sm text-error"
                            aria-label={i18n.t('deleteShift')}
                            disabled={deletingId !== null}
                            onClick={() => remove(shift)}
                          >
                            <i aria-hidden="true" className="fa-solid fa-trash" />
                          </Button>
                        </MustHavePermissions>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <nav
              className="flex flex-wrap items-center justify-between gap-4 border-t border-base-300 p-4"
              aria-label={i18n.t('tablePagination', { table: i18n.t('shifts') })}
            >
              <label className="flex items-center gap-2 text-sm">
                {i18n.t('rowsPerPage')}
                <select
                  className="select select-sm w-auto"
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </label>
              <span className="text-sm" role="status">
                {i18n.t('paginationRows', {
                  first: firstRow,
                  last: Math.min(startIndex + pageSize, totalRows),
                  total: totalRows,
                })}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  className="btn-ghost btn-sm"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  {i18n.t('previousPage')}
                </Button>
                <span className="text-sm">
                  {i18n.t('paginationPage', { page: currentPage, total: totalPages })}
                </span>
                <Button
                  type="button"
                  className="btn-ghost btn-sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  {i18n.t('nextPage')}
                </Button>
              </div>
            </nav>
          </div>
        )}
      </main>
      {calendarOpen && (
        <RouteMonthShiftDialog
          closeCalendar={() => setCalendarOpen(false)}
          openShiftForm={openNewShift}
        />
      )}
      {formOpen && users.data && (
        <ShiftFormDialog
          editingShift={editingShift}
          users={users.data.users}
          closeForm={closeForm}
          initialStartAt={initialStartAt}
        />
      )}
    </Drawer>
  );
}

interface RouteMonthShiftDialogProps {
  closeCalendar: () => void;
  openShiftForm: (startAt: string) => void;
}

function RouteMonthShiftDialog({ closeCalendar, openShiftForm }: RouteMonthShiftDialogProps) {
  const dialog = useRef<HTMLDivElement>(null);
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
    element?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      closeCalendar();
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [closeCalendar]);

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
    <div
      ref={dialog}
      className="modal modal-open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="route-month-title"
      tabIndex={-1}
    >
      <div className="modal-box flex max-h-[90dvh] w-[96vw] max-w-7xl flex-col gap-4 p-4 sm:p-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 id="route-month-title" className="text-2xl font-bold">
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
                plugins={[themePlugin, dayGridPlugin, interactionPlugin]}
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
                dayCellClass={() => 'cursor-pointer'}
                dateClick={(info) => {
                  openShiftForm(info.date.toISOString());
                }}
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
      <button
        type="button"
        className="modal-backdrop"
        aria-label={i18n.t('close')}
        onClick={closeCalendar}
      />
    </div>
  );
}
