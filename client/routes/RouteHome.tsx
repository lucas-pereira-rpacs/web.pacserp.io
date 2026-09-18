import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import HomeButtonShiftDoctor from '#components/commons/HomeButtonShiftDoctor';
import HomeButtonShiftDoctorConfirm from '#components/commons/HomeButtonShiftDoctorConfirm';
import HomeContactsDialog from '#components/commons/HomeContactsDialog';
import HomeMonthShiftDialog from '#components/commons/HomeMonthShiftDialog';
import MustHavePermissions from '#components/guards/MustHavePermissions';
import Drawer from '#components/layout/Drawer';
import { Permission } from '#enumerators/permission';
import i18n from '#locales/i18n';

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function startOfDay(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function formatHour(date: Date, locale: string) {
  let hour = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  if (locale === 'pt-BR') {
    hour = hour.replace(':00', 'h');
  }

  return hour;
}

function formatShiftRange(shift: PublicShift, locale: string) {
  const start = new Date(shift.startAt);
  const end = new Date(shift.endAt);
  return formatHour(start, locale) + ' - ' + formatHour(end, locale);
}

function shiftStartsOnDay(shift: PublicShift, dayStart: Date) {
  const start = new Date(shift.startAt);
  const nextDay = addDays(dayStart, 1);
  return start >= dayStart && start < nextDay;
}

function isNightShiftTime(date: Date) {
  const hour = date.getHours();
  if (hour >= 19) return true;
  if (hour < 7) return true;
  return false;
}

export default function RouteHome() {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  let locale = 'en-US';
  if (i18n.resolvedLanguage === 'pt') {
    locale = 'pt-BR';
  }

  const today = new Date();
  const todayStart = startOfDay(today);
  const tomorrow = addDays(todayStart, 1);
  let currentShiftName = i18n.t('homeShiftDay');
  if (isNightShiftTime(today)) {
    currentShiftName = i18n.t('homeShiftNight');
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  };

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
  const profile = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await fetch('/api/auth/profile');
      if (!response.ok) {
        throw new Error('Could not load profile');
      }

      return (await response.json()) as ProfileResponse;
    },
  });

  let canReadShifts = false;
  if (profile.data?.user.roles.includes('root')) {
    canReadShifts = true;
  }
  if (profile.data?.user.permissions.includes(Permission.ShiftsRead)) {
    canReadShifts = true;
  }

  const shifts = useQuery({
    queryKey: ['shifts'],
    enabled: canReadShifts,
    queryFn: async () => {
      const response = await fetch('/api/shifts');
      if (!response.ok) throw new Error('Could not load shifts');
      return (await response.json()) as ShiftsResponse;
    },
  });
  const users = useQuery({
    queryKey: ['shiftUsers'],
    enabled: canReadShifts,
    queryFn: async () => {
      const response = await fetch('/api/shifts/users');
      if (!response.ok) throw new Error('Could not load shift users');
      return (await response.json()) as ShiftUsersResponse;
    },
  });

  const scheduledShifts = [...(shifts.data?.shifts ?? [])]
    .filter((shift) => shift.status === 'scheduled')
    .sort((first, second) => {
      return new Date(first.startAt).getTime() - new Date(second.startAt).getTime();
    });
  const todayShifts = scheduledShifts.filter((shift) => shiftStartsOnDay(shift, todayStart));
  const tomorrowShifts = scheduledShifts.filter((shift) => shiftStartsOnDay(shift, tomorrow));
  const userById = new Map(users.data?.users.map((user) => [user.id, user]));
  const shiftDataReady = Boolean(shifts.data && users.data);
  const shiftDataLoading = canReadShifts && (shifts.isLoading || users.isLoading);
  const shiftDataError = canReadShifts && (shifts.isError || users.isError);

  return (
    <Drawer>
      <main className="flex flex-col gap-3 p-3">
        <div className="p-6">
          <h1 className="text-3xl">
            <i className="fa-solid fa-satellite-dish me-4 text-4xl"></i>
            {i18n.t('homeDashboard', {
              name: system.data?.system.name ?? import.meta.env.DEFAULT_SYSTEM_NAME,
            })}
          </h1>
          <p className="mt-3">
            {i18n.t('homeReportsDate', { date: today.toLocaleDateString(locale) })}
          </p>
        </div>
        <div className="p-6 bg-base-300 gap-3 grid rounded-2xl">
          <div className="xl:flex grid xl:justify-between text-center">
            <span>
              <i className="fa-solid fa-kit-medical me-4"></i>
              {i18n.t('homeMedicalShift')}{' '}
              {today.toLocaleDateString(locale, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}{' '}
              <span className="badge badge-neutral">{currentShiftName}</span>
            </span>
            <MustHavePermissions permissions={[Permission.ShiftsRead]}>
              <button
                type="button"
                className="link link-primary"
                onClick={() => setContactsOpen(true)}
              >
                <i className="fa-solid fa-address-book me-3"></i>
                {i18n.t('homePhoneNumbers')}
              </button>
            </MustHavePermissions>
          </div>
          <div className="xl:flex items-center text-center gap-3">
            <span>
              {i18n.t('homeShiftDate', {
                date: today.toLocaleDateString(locale),
                shift: currentShiftName,
              })}
            </span>
            <div className="flex flex-wrap justify-center xl:justify-start gap-3 items-center">
              {shiftDataLoading && <span className="loading loading-spinner loading-md" />}
              {shiftDataError && <span className="text-error">{i18n.t('shiftsLoadFailed')}</span>}
              {shiftDataReady && todayShifts.length === 0 && (
                <span>{i18n.t('homeCalendarNoShifts')}</span>
              )}
              {shiftDataReady &&
                todayShifts.map((shift) => {
                  const user = userById.get(shift.userId);
                  return (
                    <HomeButtonShiftDoctorConfirm
                      key={shift.id}
                      shift={formatShiftRange(shift, locale)}
                      fullName={user?.fullName ?? i18n.t('shiftDeletedUser')}
                      phoneNumber={user?.phoneNumber}
                    />
                  );
                })}
            </div>
          </div>
        </div>
        <div className="p-6 bg-base-300 gap-3 grid rounded-2xl">
          <div className="flex justify-between items-center">
            <p>
              <i className="fa-solid fa-calendar-days me-4"></i>
              {i18n.t('homeSchedule')}
            </p>
            <MustHavePermissions permissions={[Permission.ShiftsRead]}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setCalendarOpen(true)}
              >
                <i className="fa-solid fa-calendar me-3"></i>
                {i18n.t('homeFullMonth')}
              </button>
            </MustHavePermissions>
          </div>
          <div className="grid xl:grid-cols-2 gap-3">
            <div className="xl:flex items-center gap-3">
              <span className="font-bold">{i18n.t('homeToday')}</span>
              {today.toLocaleDateString(locale, dateOptions)}
              <div className="flex flex-wrap justify-center xl:justify-start gap-3">
                {shiftDataLoading && <span className="loading loading-spinner loading-md" />}
                {shiftDataError && <span className="text-error">{i18n.t('shiftsLoadFailed')}</span>}
                {shiftDataReady && todayShifts.length === 0 && (
                  <span>{i18n.t('homeCalendarNoShifts')}</span>
                )}
                {shiftDataReady &&
                  todayShifts.map((shift) => {
                    const user = userById.get(shift.userId);
                    return (
                      <HomeButtonShiftDoctor
                        key={shift.id}
                        shift={formatShiftRange(shift, locale)}
                        fullName={user?.fullName ?? i18n.t('shiftDeletedUser')}
                      />
                    );
                  })}
              </div>
            </div>
            <div className="xl:flex items-center gap-3">
              <span className="font-bold">{i18n.t('homeTomorrow')}</span>
              {tomorrow.toLocaleDateString(locale, dateOptions)}
              <div className="grid xl:grid-flow-col gap-3">
                {shiftDataLoading && <span className="loading loading-spinner loading-md" />}
                {shiftDataError && <span className="text-error">{i18n.t('shiftsLoadFailed')}</span>}
                {shiftDataReady && tomorrowShifts.length === 0 && (
                  <span>{i18n.t('homeCalendarNoShifts')}</span>
                )}
                {shiftDataReady &&
                  tomorrowShifts.map((shift) => {
                    const user = userById.get(shift.userId);
                    return (
                      <HomeButtonShiftDoctor
                        key={shift.id}
                        shift={formatShiftRange(shift, locale)}
                        fullName={user?.fullName ?? i18n.t('shiftDeletedUser')}
                      />
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </main>
      {calendarOpen && (
        <MustHavePermissions permissions={[Permission.ShiftsRead]}>
          <HomeMonthShiftDialog closeCalendar={() => setCalendarOpen(false)} />
        </MustHavePermissions>
      )}
      {contactsOpen && (
        <MustHavePermissions permissions={[Permission.ShiftsRead]}>
          <HomeContactsDialog
            closeContacts={() => setContactsOpen(false)}
            isError={users.isError}
            isLoading={users.isLoading}
            refetchUsers={() => {
              void users.refetch();
            }}
            users={users.data?.users ?? []}
          />
        </MustHavePermissions>
      )}
    </Drawer>
  );
}
