export type Role = "CREW_LEAD" | "PASSENGER";
export type MembershipLevel = "SILVER" | "GOLD" | "PLATINUM";
export type ResourceStatus = "ACTIVE" | "DECOMMISSIONED";
export type UsageOutcome = "ALLOWED" | "DENIED";

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  level: MembershipLevel | null;
  createdAt: string;
};

export type Resource = {
  id: string;
  name: string;
  family: string;
  minLevel: MembershipLevel;
  status: ResourceStatus;
  createdAt: string;
};

export type UsageRecord = {
  id: string;
  outcome: UsageOutcome;
  startedAt: string;
  endedAt: string | null;
  resource: Resource;
  passenger?: PublicUser;
};

export type LevelReport = {
  level: MembershipLevel;
  passengerCount: number;
  usageCount: number;
  allowedCount: number;
  deniedCount: number;
  uniqueResourcesUsed: number;
};

export type ResourceAnalytics = {
  id: string;
  name: string;
  family: string;
  minLevel: MembershipLevel;
  status: ResourceStatus;
  allowedUses: number;
  deniedUses: number;
  uniquePassengers: number;
  demandRank: number;
};
