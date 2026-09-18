import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';
import Button from '#components/elements/Button';
import i18n from '#locales/i18n';

interface Props {
  editingShift: PublicShift | null;
  users: ShiftUsersResponse['users'];
  closeForm: () => void;
  initialStartAt?: string | null;
}

function localDateTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function ShiftFormDialog({ editingShift, users, closeForm, initialStartAt }: Props) {
  const queryClient = useQueryClient();
  const schema = z
    .object({
      userId: z.string().min(1, i18n.t('shiftUserRequired')),
      startAt: z
        .string()
        .refine((value) => Number.isFinite(new Date(value).getTime()), i18n.t('shiftDateRequired')),
      endAt: z
        .string()
        .refine((value) => Number.isFinite(new Date(value).getTime()), i18n.t('shiftDateRequired')),
      status: z.enum(['scheduled', 'completed', 'cancelled']),
    })
    .refine((data) => new Date(data.endAt) > new Date(data.startAt), {
      path: ['endAt'],
      message: i18n.t('shiftEndAfterStart'),
    });
  let defaultStartAt = '';
  let defaultEndAt = '';
  if (editingShift) {
    defaultStartAt = localDateTime(editingShift.startAt);
    defaultEndAt = localDateTime(editingShift.endAt);
  }
  if (!editingShift && initialStartAt) {
    const start = new Date(initialStartAt);
    const end = new Date(start.getTime() + 60 * 60_000);
    defaultStartAt = localDateTime(start.toISOString());
    defaultEndAt = localDateTime(end.toISOString());
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      userId: editingShift?.userId ?? '',
      startAt: defaultStartAt,
      endAt: defaultEndAt,
      status: editingShift?.status ?? 'scheduled',
    },
  });

  async function submit(data: z.infer<typeof schema>) {
    let url = '/api/shifts';
    let method = 'POST';
    if (editingShift) {
      url = `/api/shifts/${editingShift.id}`;
      method = 'PUT';
    }
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          startAt: new Date(data.startAt).toISOString(),
          endAt: new Date(data.endAt).toISOString(),
        }),
      });
      if (!response.ok) {
        toast.error(i18n.t('shiftSaveFailed'));
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['shifts'] });
      closeForm();
      toast.success(i18n.t('shiftSaved'));
    } catch {
      toast.error(i18n.t('serverUnreachable'));
    }
  }

  let title = i18n.t('newShift');
  if (editingShift) title = i18n.t('editShift');

  return (
    <div
      className="modal modal-open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shift-form-title"
    >
      <div className="modal-box">
        <h2 id="shift-form-title" className="mb-4 text-xl font-bold">
          {title}
        </h2>
        <form className="fieldset gap-3" noValidate onSubmit={handleSubmit(submit)}>
          <label className="label" htmlFor="shift-user">
            {i18n.t('shiftUser')}
          </label>
          <select
            id="shift-user"
            className="select select-primary w-full"
            disabled={isSubmitting}
            {...register('userId')}
          >
            <option value="">{i18n.t('selectShiftUser')}</option>
            {editingShift && !users.some((user) => user.id === editingShift.userId) && (
              <option value={editingShift.userId} disabled>
                {i18n.t('shiftDeletedUser')}
              </option>
            )}
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName} ({user.email})
              </option>
            ))}
          </select>
          {errors.userId && <p className="text-error">{errors.userId.message}</p>}
          <label className="label" htmlFor="shift-start">
            {i18n.t('shiftStart')}
          </label>
          <input
            id="shift-start"
            type="datetime-local"
            className="input w-full"
            disabled={isSubmitting}
            {...register('startAt')}
          />
          {errors.startAt && <p className="text-error">{errors.startAt.message}</p>}
          <label className="label" htmlFor="shift-end">
            {i18n.t('shiftEnd')}
          </label>
          <input
            id="shift-end"
            type="datetime-local"
            className="input w-full"
            disabled={isSubmitting}
            {...register('endAt')}
          />
          {errors.endAt && <p className="text-error">{errors.endAt.message}</p>}
          <p className="text-sm text-base-content/60">{i18n.t('shiftLocalTime')}</p>
          <label className="label" htmlFor="shift-status">
            {i18n.t('shiftStatus')}
          </label>
          <select
            id="shift-status"
            className="select select-primary w-full"
            disabled={isSubmitting}
            {...register('status')}
          >
            <option value="scheduled">{i18n.t('shiftScheduled')}</option>
            <option value="completed">{i18n.t('shiftCompleted')}</option>
            <option value="cancelled">{i18n.t('shiftCancelled')}</option>
          </select>
          <div className="modal-action">
            <Button type="button" className="btn-ghost" disabled={isSubmitting} onClick={closeForm}>
              {i18n.t('cancel')}
            </Button>
            <Button
              type="submit"
              className="btn-primary"
              isLoading={isSubmitting}
              disabled={isSubmitting || users.length === 0}
            >
              {i18n.t('save')}
            </Button>
          </div>
        </form>
      </div>
      <button
        type="button"
        className="modal-backdrop"
        aria-label={i18n.t('close')}
        disabled={isSubmitting}
        onClick={closeForm}
      />
    </div>
  );
}
