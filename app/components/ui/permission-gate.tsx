"use client";

import React from "react";
import { useAuth } from "@/app/context/auth";
import { usePermission } from "@/app/hooks/usePermission";
import { PermissionModule, PermissionAction } from "@/lib/permissions";

interface PermissionGateProps {
  module: PermissionModule;
  action: PermissionAction;
  /** Rendered when the user does NOT have permission. Defaults to null. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({ module, action, fallback = null, children }: PermissionGateProps) {
  const allowed = usePermission(module, action);

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ─── RoleGate ────────────────────────────────────────────────────────────
// Renders children only for specific roles.
// Usage:
//   <RoleGate roles={["school_admin", "super_admin"]}>
//     <AdminPanel />
//   </RoleGate>

interface RoleGateProps {
  roles: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RoleGate({ roles, fallback = null, children }: RoleGateProps) {
  const { user } = useAuth();
  const role = user?.role ?? "";

  if (!roles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
