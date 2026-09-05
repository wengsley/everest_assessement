import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { HttpError } from "../utils/errors.js";
import { MEMBERSHIP_KEY } from "../utils/catalog.js";
import { RESOURCE_STATUS, USAGE_OUTCOME } from "../utils/status.js";
import {
  listAvailableResources,
  useResource,
} from "../services/resourcesService.js";
import { getMyHistory } from "../services/usageService.js";
import {
  ensureCatalog,
  makePassenger,
  makeResource,
  resetTransactionalData,
} from "./fixtures.js";

const LEVELS = [
  MEMBERSHIP_KEY.SILVER,
  MEMBERSHIP_KEY.GOLD,
  MEMBERSHIP_KEY.PLATINUM,
] as const;

const RANK = {
  SILVER: 0,
  GOLD: 1,
  PLATINUM: 2,
} as const;

describe("resource access matrix", () => {
  beforeAll(async () => {
    await ensureCatalog();
  });

  beforeEach(async () => {
    await resetTransactionalData();
  });

  const cases = LEVELS.flatMap((passengerLevel) =>
    LEVELS.flatMap((minLevel) =>
      [RESOURCE_STATUS.ACTIVE, RESOURCE_STATUS.DECOMMISSIONED].map((status) => ({
        passengerLevel,
        minLevel,
        status,
        expectAllowed:
          status === RESOURCE_STATUS.ACTIVE &&
          RANK[passengerLevel] >= RANK[minLevel],
      })),
    ),
  );

  it.each(cases)(
    "$passengerLevel vs $minLevel $status",
    async ({ passengerLevel, minLevel, status, expectAllowed }) => {
      const passenger = await makePassenger(passengerLevel);
      const resource = await makeResource({ minLevel, status });

      if (expectAllowed) {
        const result = await useResource(passenger.id, resource.id);
        expect(result.usage.outcome).toBe(USAGE_OUTCOME.ALLOWED);
      } else {
        await expect(useResource(passenger.id, resource.id)).rejects.toBeInstanceOf(
          HttpError,
        );
      }

      const { history } = await getMyHistory(passenger.id);
      expect(history).toHaveLength(1);
      expect(history[0]?.outcome).toBe(
        expectAllowed ? USAGE_OUTCOME.ALLOWED : USAGE_OUTCOME.DENIED,
      );
    },
  );

  it("lists only active stations the passenger's rank can enter", async () => {
    const silver = await makePassenger(MEMBERSHIP_KEY.SILVER);
    const gold = await makePassenger(MEMBERSHIP_KEY.GOLD);
    await makeResource({
      minLevel: MEMBERSHIP_KEY.SILVER,
      name: "Silver bay",
    });
    await makeResource({
      minLevel: MEMBERSHIP_KEY.GOLD,
      name: "Gold bay",
    });
    await makeResource({
      minLevel: MEMBERSHIP_KEY.SILVER,
      status: RESOURCE_STATUS.DECOMMISSIONED,
      name: "Retired silver",
    });

    const silverView = await listAvailableResources(silver.id);
    const goldView = await listAvailableResources(gold.id);

    expect(silverView.resources.map((row) => row.name)).toEqual(["Silver bay"]);
    expect(goldView.resources.map((row) => row.name).sort()).toEqual([
      "Gold bay",
      "Silver bay",
    ]);
  });
});
