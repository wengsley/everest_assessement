import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MEMBERSHIP_KEY } from "../utils/catalog.js";
import { USAGE_OUTCOME } from "../utils/status.js";
import { getAnalytics, getByLevel } from "../services/reportsService.js";
import { createUsageEvent } from "../models/usageEvent.js";
import {
  ensureCatalog,
  makePassenger,
  makeResource,
  resetTransactionalData,
} from "./fixtures.js";

// 1. Create Silver + Gold passengers, Food (Silver) and Bay (Gold).
// 2. Four usage rows: Silver allowed Food / denied Bay; Gold allowed both.
// 3. getByLevel totals per membership; getAnalytics demand; Food is high demand.
describe("report aggregation", () => {
  beforeAll(async () => {
    await ensureCatalog();
  });

  beforeEach(async () => {
    await resetTransactionalData();
  });

  it("counts passengers and outcomes per membership in SQL", async () => {
    const silver = await makePassenger(MEMBERSHIP_KEY.SILVER, "s@mail.com");
    const gold = await makePassenger(MEMBERSHIP_KEY.GOLD, "g@mail.com");
    const food = await makeResource({
      minLevel: MEMBERSHIP_KEY.SILVER,
      name: "Food",
    });
    const bay = await makeResource({
      minLevel: MEMBERSHIP_KEY.GOLD,
      name: "Bay",
    });

    await createUsageEvent({
      passengerId: silver.id,
      resourceId: food.id,
      outcome: USAGE_OUTCOME.ALLOWED,
    });
    await createUsageEvent({
      passengerId: silver.id,
      resourceId: bay.id,
      outcome: USAGE_OUTCOME.DENIED,
    });
    await createUsageEvent({
      passengerId: gold.id,
      resourceId: bay.id,
      outcome: USAGE_OUTCOME.ALLOWED,
    });
    await createUsageEvent({
      passengerId: gold.id,
      resourceId: food.id,
      outcome: USAGE_OUTCOME.ALLOWED,
    });

    const byLevel = await getByLevel();
    const silverRow = byLevel.find((row) => row.level === MEMBERSHIP_KEY.SILVER);
    const goldRow = byLevel.find((row) => row.level === MEMBERSHIP_KEY.GOLD);
    const platinumRow = byLevel.find(
      (row) => row.level === MEMBERSHIP_KEY.PLATINUM,
    );

    expect(silverRow).toMatchObject({
      passengerCount: 1,
      usageCount: 2,
      allowedCount: 1,
      deniedCount: 1,
      uniqueResourcesUsed: 1,
    });
    expect(goldRow).toMatchObject({
      passengerCount: 1,
      usageCount: 2,
      allowedCount: 2,
      deniedCount: 0,
      uniqueResourcesUsed: 2,
    });
    expect(platinumRow).toMatchObject({
      passengerCount: 0,
      usageCount: 0,
    });

    const analytics = await getAnalytics();
    const foodRow = analytics.resources.find((row) => row.name === "Food");
    const bayRow = analytics.resources.find((row) => row.name === "Bay");

    expect(foodRow).toMatchObject({
      allowedUses: 2,
      deniedUses: 0,
      uniquePassengers: 2,
    });
    expect(bayRow).toMatchObject({
      allowedUses: 1,
      deniedUses: 1,
      uniquePassengers: 1,
    });
    expect(analytics.highDemand.map((row) => row.name)).toEqual(["Food"]);
  });
});
