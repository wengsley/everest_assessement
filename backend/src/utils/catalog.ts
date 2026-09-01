/**
 * Role and membership keys, plus primary-role resolution.
 * @author wengsley
 */

export const ROLE_KEY = {
  CREW_LEAD: "CREW_LEAD",
  PASSENGER: "PASSENGER",
} as const;

export const MEMBERSHIP_KEY = {
  SILVER: "SILVER",
  GOLD: "GOLD",
  PLATINUM: "PLATINUM",
} as const;

export function primaryRoleKey(
  user: { roleUsers: Array<{ role: { key: string } }> },
): string {
  const keys = user.roleUsers.map((item) => item.role.key);
  if (keys.includes(ROLE_KEY.CREW_LEAD)) {
    return ROLE_KEY.CREW_LEAD;
  }
  return keys[0] ?? ROLE_KEY.PASSENGER;
}
