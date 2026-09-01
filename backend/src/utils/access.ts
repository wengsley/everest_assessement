/**
 * Membership rank checks and the Crew Lead headcount cap.
 * @author wengsley
 */

export function canAccess(passengerRank: number, minRank: number): boolean {
  return passengerRank >= minRank;
}

export const CREW_LEAD_CAP = 3;
