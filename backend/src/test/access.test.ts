import { describe, expect, it } from "vitest";
import { canAccess } from "../utils/access.js";

describe("canAccess", () => {
  it.each([
    [0, 0, true],
    [0, 1, false],
    [0, 2, false],
    [1, 0, true],
    [1, 1, true],
    [1, 2, false],
    [2, 0, true],
    [2, 1, true],
    [2, 2, true],
  ] as const)(
    "passenger rank %i vs min rank %i is %s",
    (passengerRank, minRank, allowed) => {
      expect(canAccess(passengerRank, minRank)).toBe(allowed);
    },
  );
});
