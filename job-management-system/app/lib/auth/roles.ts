export const ROLES = ["admin", "manager", "sales", "technician", "customer"] as const;

export type Role = (typeof ROLES)[number];

export const STAFF_ROLES: Role[] = ["admin", "manager", "sales", "technician"];

/** Roles allowed to see every job, not just their own assignments. */
export const FULL_JOB_VISIBILITY_ROLES: Role[] = ["admin", "manager", "sales"];

/** Roles allowed to manage other users' accounts and roles. */
export const USER_MANAGEMENT_ROLES: Role[] = ["admin"];

export function isStaff(role: Role | null | undefined): boolean {
  return !!role && STAFF_ROLES.includes(role);
}
