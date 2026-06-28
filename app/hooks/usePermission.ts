"use client";

import { useAuth } from "@/app/context/auth";
import { hasPermission, PermissionModule, PermissionAction } from "@/lib/permissions";

// ─── usePermission hook ───────────────────────────────────────────────────
// Returns true if the current logged-in user has the given permission.
// Usage:
//   const canCreateFees = usePermission("fees", "create");
//   if (!canCreateFees) return null;

export function usePermission(module: PermissionModule, action: PermissionAction): boolean {
  const { user, permissions } = useAuth();
  if (!user?.role) return false;
  
  if (permissions && permissions[user.role]) {
    const rolePerms = permissions[user.role];
    const modulePerms = rolePerms[module];
    return Array.isArray(modulePerms) && modulePerms.includes(action);
  }
  
  return hasPermission(user.role, module, action);
}

// ─── usePermissions (multi-check) ────────────────────────────────────────
// Returns an object with boolean flags for multiple permissions at once.
// Usage:
//   const perms = usePermissions("fees", ["view", "create", "edit", "delete"]);
//   if (perms.create) { ... }

export function usePermissions(
  module: PermissionModule,
  actions: PermissionAction[]
): Record<PermissionAction, boolean> {
  const { user, permissions } = useAuth();
  const role = user?.role ?? "";

  return actions.reduce((acc, action) => {
    if (permissions && permissions[role]) {
      const rolePerms = permissions[role];
      const modulePerms = rolePerms[module];
      acc[action] = Array.isArray(modulePerms) && modulePerms.includes(action);
    } else {
      acc[action] = role ? hasPermission(role, module, action) : false;
    }
    return acc;
  }, {} as Record<PermissionAction, boolean>);
}

// ─── useRole helper ───────────────────────────────────────────────────────
// Returns the current user's mapped role
export function useRole() {
  const { user } = useAuth();
  return user?.role ?? null;
}

