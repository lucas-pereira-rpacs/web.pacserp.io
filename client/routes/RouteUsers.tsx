import UserFormDialog from '#components/commons/UserFormDialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Permission } from '#enumerators/permission';
import Button from '#components/elements/Button';
import MustHavePermissions from '#components/guards/MustHavePermissions';
import Drawer from '#components/layout/Drawer';
import i18n from '#locales/i18n';

export default function RouteUsers() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formOpen, setFormOpen] = useState(false);
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
  const users = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Could not load users');
      }
      return (await response.json()) as UsersResponse;
    },
  });
  const roles = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await fetch('/api/roles');
      if (!response.ok) throw new Error('Could not load roles');
      return (await response.json()) as RolesResponse;
    },
  });
  const isRoot = profile.data?.user.roles.includes('root') ?? false;

  function openCreate() {
    setEditingUser(null);
    setFormOpen(true);
  }

  function openEdit(user: UserProfile) {
    setEditingUser(user);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingUser(null);
  }

  async function remove(user: UserProfile) {
    if (!window.confirm(i18n.t('deleteUserConfirm', { name: user.fullName }))) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!response.ok) {
        toast.error(i18n.t('userDeleteFailed'));
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(i18n.t('userDeleted'));
    } catch {
      toast.error(i18n.t('serverUnreachable'));
    }
  }

  const totalRows = users.data?.users.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleRows = users.data?.users.slice(startIndex, startIndex + pageSize) ?? [];
  let firstRow = 0;
  if (totalRows > 0) firstRow = startIndex + 1;

  if (users.data && page !== currentPage) {
    setPage(currentPage);
  }

  return (
    <MustHavePermissions permissions={[Permission.UsersRead]}>
      <Drawer>
        <main className="p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold">{i18n.t('users')}</h1>
            <MustHavePermissions permissions={[Permission.UsersCreate]}>
              <Button type="button" className="btn-primary" onClick={openCreate}>
                <i aria-hidden="true" className="fa-solid fa-plus" />
                {i18n.t('newUser')}
              </Button>
            </MustHavePermissions>
          </div>

          {users.isLoading && <span className="loading loading-spinner loading-md" />}
          {users.isError && <p className="text-error">{i18n.t('usersLoadFailed')}</p>}
          {users.data && (
            <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
              <table className="table">
                <thead>
                  <tr>
                    <th>{i18n.t('fullName')}</th>
                    <th>{i18n.t('email')}</th>
                    <th>{i18n.t('phoneNumber')}</th>
                    <th>{i18n.t('roles')}</th>
                    <th className="text-right">{i18n.t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((user) => {
                    const isTargetRoot = user.roles.includes('root');
                    const canManage = isRoot || !isTargetRoot;
                    const canDelete = canManage && user.id !== profile.data?.user.id;
                    return (
                      <tr key={user.id}>
                        <td className="font-medium">{user.fullName}</td>
                        <td>{user.email}</td>
                        <td>{user.phoneNumber || '—'}</td>
                        <td>
                          <div className="flex gap-2">
                            {user.roles.map((role) => (
                              <span key={role} className="badge badge-outline">
                                {i18n.t(role)}
                              </span>
                            ))}
                            {user.roles.length === 0 && (
                              <span className="text-base-content/50">—</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="flex justify-end gap-2">
                            <MustHavePermissions permissions={[Permission.UsersUpdate]}>
                              <Button
                                type="button"
                                className="btn-ghost btn-sm"
                                disabled={!canManage}
                                aria-label={i18n.t('editUser')}
                                onClick={() => openEdit(user)}
                              >
                                <i aria-hidden="true" className="fa-solid fa-pen" />
                              </Button>
                            </MustHavePermissions>
                            <MustHavePermissions permissions={[Permission.UsersDelete]}>
                              <Button
                                type="button"
                                className="btn-ghost btn-sm text-error"
                                disabled={!canDelete}
                                aria-label={i18n.t('deleteUser')}
                                onClick={() => remove(user)}
                              >
                                <i aria-hidden="true" className="fa-solid fa-trash" />
                              </Button>
                            </MustHavePermissions>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <nav
                className="flex flex-wrap items-center justify-between gap-4 border-t border-base-300 p-4"
                aria-label={i18n.t('tablePagination', { table: i18n.t('users') })}
              >
                <label className="flex items-center gap-2 text-sm">
                  {i18n.t('rowsPerPage')}
                  <select
                    className="select select-bordered select-sm w-auto"
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

        {formOpen && (
          <UserFormDialog
            editingUser={editingUser}
            closeForm={closeForm}
            roles={roles.data?.roles ?? []}
            isRoot={isRoot}
          />
        )}
      </Drawer>
    </MustHavePermissions>
  );
}
