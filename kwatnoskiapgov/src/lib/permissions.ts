export type UserRole = "teacher" | "scorekeeper" | "student" | "monitor";

export interface RolePermissions {
  canEditSetup: boolean;
  canEditTokens: boolean;
  canApplyCards: boolean;
  canFinalizePrimaries: boolean;
  canRunConvention: boolean;
  canRunElectionNight: boolean;
  canOverrideResults: boolean;
  canResetGame: boolean;
  canImportExport: boolean;
  canViewTeacherTools: boolean;
  canViewPrivateControls: boolean;
  canUndo: boolean;
  canManageCalendar: boolean;
  canViewActionLog: boolean;
}

export const permissionsByRole: Record<UserRole, RolePermissions> = {
  teacher: {
    canEditSetup: true,
    canEditTokens: true,
    canApplyCards: true,
    canFinalizePrimaries: true,
    canRunConvention: true,
    canRunElectionNight: true,
    canOverrideResults: true,
    canResetGame: true,
    canImportExport: true,
    canViewTeacherTools: true,
    canViewPrivateControls: true,
    canUndo: true,
    canManageCalendar: true,
    canViewActionLog: true
  },
  scorekeeper: {
    canEditSetup: false,
    canEditTokens: true,
    canApplyCards: true,
    canFinalizePrimaries: false,
    canRunConvention: false,
    canRunElectionNight: false,
    canOverrideResults: false,
    canResetGame: false,
    canImportExport: false,
    canViewTeacherTools: false,
    canViewPrivateControls: false,
    canUndo: true,
    canManageCalendar: true,
    canViewActionLog: true
  },
  student: {
    canEditSetup: false,
    canEditTokens: false,
    canApplyCards: false,
    canFinalizePrimaries: false,
    canRunConvention: false,
    canRunElectionNight: false,
    canOverrideResults: false,
    canResetGame: false,
    canImportExport: false,
    canViewTeacherTools: false,
    canViewPrivateControls: false,
    canUndo: false,
    canManageCalendar: false,
    canViewActionLog: false
  },
  monitor: {
    canEditSetup: false,
    canEditTokens: false,
    canApplyCards: false,
    canFinalizePrimaries: false,
    canRunConvention: false,
    canRunElectionNight: false,
    canOverrideResults: false,
    canResetGame: false,
    canImportExport: false,
    canViewTeacherTools: false,
    canViewPrivateControls: false,
    canUndo: false,
    canManageCalendar: false,
    canViewActionLog: true
  }
};

export type PermissionName = keyof RolePermissions;

export function getPermissions(role: UserRole | null): RolePermissions {
  if (!role) return permissionsByRole.monitor;
  return permissionsByRole[role];
}

export function hasPermission(role: UserRole | null, permission: PermissionName): boolean {
  return getPermissions(role)[permission];
}

export function roleLabel(role: UserRole): string {
  return role === "teacher"
    ? "Teacher Mode"
    : role === "scorekeeper"
      ? "Scorekeeper Mode"
      : role === "student"
        ? "Student Candidate View"
        : "Class Monitor View";
}
