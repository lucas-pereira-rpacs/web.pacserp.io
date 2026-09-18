import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Permission, type Permission as PermissionValue } from '#enumerators/permission';
import Button from '#components/elements/Button';
import Label from '#components/elements/Label';
import Text from '#components/elements/Text';
import i18n from '#locales/i18n';

const permissionValues = Object.values(Permission);
interface Props {
  permissionsRole: PublicRole;
  rolePermissions: PublicRolePermission[];
  closePermissions: () => void;
}

export default function RolePermissionsDialog({
  permissionsRole,
  rolePermissions,
  closePermissions,
}: Props) {
  const queryClient = useQueryClient();
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionValue[]>(() =>
    rolePermissions
      .filter((assignment) => assignment.role_id === permissionsRole.id)
      .map((assignment) => assignment.permission),
  );
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  function togglePermission(permission: PermissionValue) {
    if (selectedPermissions.includes(permission)) {
      setSelectedPermissions(selectedPermissions.filter((selected) => selected !== permission));
      return;
    }

    setSelectedPermissions([...selectedPermissions, permission]);
  }

  async function savePermissions() {
    const existingAssignments = rolePermissions.filter(
      (rolePermission) => rolePermission.role_id === permissionsRole.id,
    );
    const existingPermissions = new Set(
      existingAssignments.map((rolePermission) => rolePermission.permission),
    );
    const assignmentsToCreate = selectedPermissions.filter(
      (permission) => !existingPermissions.has(permission),
    );
    const assignmentsToDelete = existingAssignments.filter(
      (rolePermission) => !selectedPermissions.includes(rolePermission.permission),
    );

    setIsSavingPermissions(true);
    try {
      const responses = await Promise.all([
        ...assignmentsToCreate.map((permission) =>
          fetch('/api/roles-permissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role_id: permissionsRole.id, permission }),
          }),
        ),
        ...assignmentsToDelete.map((rolePermission) =>
          fetch(`/api/roles-permissions/${rolePermission.id}`, { method: 'DELETE' }),
        ),
      ]);
      await queryClient.invalidateQueries({ queryKey: ['rolePermissions'] });
      if (responses.some((response) => !response.ok)) {
        toast.error(i18n.t('rolePermissionSaveFailed'));
        return;
      }

      closePermissions();
      toast.success(i18n.t('rolePermissionSaved'));
    } catch {
      toast.error(i18n.t('serverUnreachable'));
    } finally {
      setIsSavingPermissions(false);
    }
  }

  return (
    <div className="modal modal-open" role="dialog" aria-modal="true">
      <div className="modal-box max-h-[calc(100vh-2rem)] overflow-y-auto">
        <Text as="h2" className="mb-1 text-xl font-bold">
          {i18n.t('rolePermissions')}
        </Text>
        <Text className="mb-4 text-base-content/60">{permissionsRole.name}</Text>
        <div className="grid gap-3">
          {permissionValues.map((permission) => (
            <Label key={permission} className="cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                checked={selectedPermissions.includes(permission)}
                onChange={() => togglePermission(permission)}
              />
              {i18n.t(permission)}
            </Label>
          ))}
        </div>
        <div className="modal-action">
          <Button
            type="button"
            className="btn-ghost"
            disabled={isSavingPermissions}
            onClick={closePermissions}
          >
            {i18n.t('cancel')}
          </Button>
          <Button
            type="button"
            className="btn-primary"
            isLoading={isSavingPermissions}
            disabled={isSavingPermissions}
            onClick={savePermissions}
          >
            {i18n.t('save')}
          </Button>
        </div>
      </div>
      <button
        type="button"
        className="modal-backdrop"
        aria-label={i18n.t('close')}
        onClick={closePermissions}
      />
    </div>
  );
}
