/**
 * Resource status and usage outcome string constants.
 * @author wengsley
 */

export const RESOURCE_STATUS = {
  ACTIVE: "ACTIVE",
  DECOMMISSIONED: "DECOMMISSIONED",
} as const;

export const USAGE_OUTCOME = {
  ALLOWED: "ALLOWED",
  DENIED: "DENIED",
} as const;

export type ResourceStatus =
  (typeof RESOURCE_STATUS)[keyof typeof RESOURCE_STATUS];
export type UsageOutcome = (typeof USAGE_OUTCOME)[keyof typeof USAGE_OUTCOME];
