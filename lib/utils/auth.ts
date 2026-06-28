import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, JWTPayload } from "@/lib/utils/jwt";

// Attach user to a header so Route Handlers can read it
export function getAuthUser(request: NextRequest): JWTPayload | null {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const token = authHeader.split(" ")[1];
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}

// ─── Reusable guard: authenticate + tenant-scope ─────────────────
// Usage in route handler:
//   const { user, schoolId, error } = await requireAuth(request);
//   if (error) return error;
export function requireAuth(
  request: NextRequest,
  requiredRoles?: string[]
): { user: JWTPayload; userId: string; role: string; schoolId: string | null; error: null } | { user: null; userId: null; role: null; schoolId: null; error: NextResponse } {
  const user = getAuthUser(request);

  if (!user) {
    return {
      user: null,
      userId: null,
      role: null,
      schoolId: null,
      error: NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 }),
    };
  }

  if (requiredRoles && !requiredRoles.includes(user.role)) {
    const isDashboardReadRole = user.role === "parent" || user.role === "student";
    const isGetRequest = request.method === "GET";
    const teacherCanAccess = requiredRoles.includes("teacher");

    if (!(isDashboardReadRole && isGetRequest && teacherCanAccess)) {
      return {
        user: null,
        userId: null,
        role: null,
        schoolId: null,
        error: NextResponse.json(
          { success: false, message: `Access denied. Required: ${requiredRoles.join(", ")}` },
          { status: 403 }
        ),
      };
    }
  }

  // Non-super-admins MUST have school_id
  if (user.role !== "super_admin" && !user.school_id) {
    return {
      user: null,
      userId: null,
      role: null,
      schoolId: null,
      error: NextResponse.json({ success: false, message: "No school context" }, { status: 403 }),
    };
  }

  return { user, userId: user.user_id, role: user.role, schoolId: user.school_id || null, error: null };
}

import connectDB from "@/lib/db";
import RolePermission from "@/lib/models/RolePermission";

// ─── Reusable guard: authenticate + permission check ─────────────
// Usage in route handler:
//   const { user, error } = await requirePermission(request, "fees", "create");
//   if (error) return error;
export async function requirePermission(
  request: NextRequest,
  module: import("@/lib/permissions").PermissionModule,
  action: import("@/lib/permissions").PermissionAction
): Promise<{ user: JWTPayload; userId: string; role: string; schoolId: string | null; error: null } | { user: null; userId: null; role: null; schoolId: null; error: NextResponse }> {
  const authResult = requireAuth(request);
  if (authResult.error) return authResult;

  try {
    await connectDB();
    const dbPerm = await RolePermission.findOne({ school_id: authResult.schoolId, role: authResult.role }).lean();
    
    let allowed = false;
    if (dbPerm && dbPerm.permissions) {
      const permsObj = dbPerm.permissions instanceof Map 
        ? Object.fromEntries(dbPerm.permissions) 
        : dbPerm.permissions;
      const actions = (permsObj as any)[module];
      allowed = Array.isArray(actions) && actions.includes(action);
    } else {
      const { hasPermission } = require("@/lib/permissions");
      allowed = hasPermission(authResult.role, module, action);
    }

    if (!allowed) {
      return {
        user: null,
        userId: null,
        role: null,
        schoolId: null,
        error: NextResponse.json(
          { success: false, message: `Permission denied: cannot '${action}' in '${module}'` },
          { status: 403 }
        ),
      };
    }
  } catch (err) {
    console.error("[requirePermission error]", err);
    return {
      user: null,
      userId: null,
      role: null,
      schoolId: null,
      error: NextResponse.json(
        { success: false, message: "Internal Auth Error" },
        { status: 500 }
      ),
    };
  }

  return authResult;
}
