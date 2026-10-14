/**
 * Centralized Role Definitions & Normalization Utility
 * Ensures roles with spaces (e.g. "IT MANAGER", "ASSET MANAGER") or casing variations
 * are consistently resolved across routing, permissions, and UI displays.
 */

export const ROLES = {
  ADMIN: 'ADMIN',
  SYSTEM_ADMIN: 'ADMIN',
  IT_MANAGER: 'IT_MANAGER',
  TECHNICIAN: 'TECHNICIAN',
  EMPLOYEE: 'EMPLOYEE',
  ASSET_MANAGER: 'ASSET_MANAGER'
};

export const normalizeRole = (role) => {
  if (!role) return 'EMPLOYEE';
  const clean = String(role).trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (clean === 'SYSTEM_ADMIN') return 'ADMIN';
  return clean;
};

export const formatRoleLabel = (role) => {
  const norm = normalizeRole(role);
  switch (norm) {
    case 'ADMIN':
      return 'System Admin';
    case 'IT_MANAGER':
      return 'IT Manager';
    case 'TECHNICIAN':
      return 'Technician';
    case 'EMPLOYEE':
      return 'Employee';
    case 'ASSET_MANAGER':
      return 'Asset Manager';
    default:
      return norm.replace(/_/g, ' ');
  }
};

export const isRoleMatch = (currentRole, allowedRoles = []) => {
  const normCurrent = normalizeRole(currentRole);
  const normalizedAllowed = new Set(allowedRoles.map(normalizeRole));
  if (normalizedAllowed.has('ADMIN')) {
    normalizedAllowed.add('SYSTEM_ADMIN');
  }
  return normalizedAllowed.has(normCurrent);
};
