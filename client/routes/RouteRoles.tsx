import RolePermissionsDialog from '#components/commons/RolePermissionsDialog';
import RoleFormDialog from '#components/commons/RoleFormDialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Permission } from '#enumerators/permission';
import Button from '#components/elements/Button';
import Icon from '#components/elements/Icon';
import Text from '#components/elements/Text';
import MustHavePermissions from '#components/guards/MustHavePermissions';
import Drawer from '#components/layout/Drawer';
import i18n from '#locales/i18n';

export default function RouteRoles() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingRole, setEditingRole] = useState<PublicRole | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [permissionsRole, setPermissionsRole] = useState<PublicRole | null>(null);
  const roles = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await fetch('/api/roles');
      if (!response.ok) throw new Error('Could not load roles');
      return (await response.json()) as RolesResponse;
    },
  });
  const rolePermissions = useQuery({
    queryKey: ['rolePermissions'],
    queryFn: async () => {
      const response = await fetch('/api/roles-permissions');
      if (!response.ok) throw new Error('Could not load role permissions');
      return (await response.json()) as RolePermissionsResponse;
    },
  });
  function openCreate() {
    setEditingRole(null);
    setFormOpen(true);
  }

  function openEdit(role: PublicRole) {
    setEditingRole(role);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingRole(null);
  }

  function openPermissions(role: PublicRole) {
    setPermissionsRole(role);
  }

  function closePermissions() {
    setPermissionsRole(null);
  }

  async function remove(role: PublicRole) {
    if (!window.confirm(i18n.t('deleteRoleConfirm', { name: role.name }))) return;
    try {
      const response = await fetch(`/api/roles/${role.id}`, { method: 'DELETE' });
      if (!response.ok) {
        toast.error(i18n.t('roleDeleteFailed'));
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['roles'] });
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await queryClient.invalidateQueries({ queryKey: ['rolePermissions'] });
      toast.success(i18n.t('roleDeleted'));
    } catch {
      toast.error(i18n.t('serverUnreachable'));
    }
  }

  const totalRows = roles.data?.roles.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleRows = roles.data?.roles.slice(startIndex, startIndex + pageSize) ?? [];
  let firstRow = 0;
  if (totalRows > 0) firstRow = startIndex + 1;

  if (roles.data && page !== currentPage) {
    setPage(currentPage);
  }

  return (
    <MustHavePermissions permissions={[Permission.RolesRead]}>
      <Drawer>
        <main className="p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <Text as="h1" className="text-2xl font-bold">
              {i18n.t('roles')}
            </Text>
            <MustHavePermissions permissions={[Permission.RolesCreate]}>
              <Button type="button" className="btn-primary" onClick={openCreate}>
                <Icon className="fa-solid fa-plus" />
                {i18n.t('newRole')}
              </Button>
            </MustHavePermissions>
          </div>
          {(roles.isLoading || rolePermissions.isLoading) && (
            <span className="loading loading-spinner loading-md" />
          )}
          {(roles.isError || rolePermissions.isError) && (
            <Text className="text-error">{i18n.t('rolesLoadFailed')}</Text>
          )}
          {roles.data && rolePermissions.data && (
            <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
              <table className="table">
                <thead>
                  <tr>
                    <th>{i18n.t('roleName')}</th>
                    <th>{i18n.t('users')}</th>
                    <th className="text-right">{i18n.t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((role) => {
                    const isSystem = role.name === 'admin' || role.name === 'root';
                    return (
                      <tr key={role.id}>
                        <td className="font-medium">{role.name}</td>
                        <td>{role.usersCount}</td>
                        <td>
                          <div className="flex justify-end gap-2">
                            <MustHavePermissions permissions={[Permission.RolesUpdate]}>
                              <div className="tooltip" data-tip={i18n.t('rolePermissions')}>
                                <Button
                                  type="button"
                                  className="btn-circle btn-ghost btn-sm"
                                  disabled={role.name === 'root'}
                                  aria-label={i18n.t('rolePermissions')}
                                  onClick={() => openPermissions(role)}
                                >
                                  <Icon className="fa-solid fa-key" />
                                </Button>
                              </div>
                              <Button
                                type="button"
                                className="btn-ghost btn-sm"
                                disabled={isSystem}
                                aria-label={i18n.t('editRole')}
                                onClick={() => openEdit(role)}
                              >
                                <Icon className="fa-solid fa-pen" />
                              </Button>
                            </MustHavePermissions>
                            <MustHavePermissions permissions={[Permission.RolesDelete]}>
                              <Button
                                type="button"
                                className="btn-ghost btn-sm text-error"
                                disabled={isSystem}
                                aria-label={i18n.t('deleteRole')}
                                onClick={() => remove(role)}
                              >
                                <Icon className="fa-solid fa-trash" />
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
                aria-label={i18n.t('tablePagination', { table: i18n.t('roles') })}
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
        {formOpen && <RoleFormDialog editingRole={editingRole} closeForm={closeForm} />}
        {permissionsRole && rolePermissions.data && (
          <RolePermissionsDialog
            permissionsRole={permissionsRole}
            rolePermissions={rolePermissions.data.rolePermissions}
            closePermissions={closePermissions}
          />
        )}
      </Drawer>
    </MustHavePermissions>
  );
}
