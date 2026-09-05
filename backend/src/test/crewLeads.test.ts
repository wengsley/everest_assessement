import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createCrewLead, listCrewLeads } from "../services/crewLeadsService.js";
import { createCrewLeadIfUnderCap } from "../models/user.js";
import { CREW_LEAD_CAP } from "../utils/access.js";
import { HttpError } from "../utils/errors.js";
import {
  ensureCatalog,
  makeCrew,
  passwordHash,
  resetTransactionalData,
} from "./fixtures.js";

function underCap(index: number) {
  return createCrewLeadIfUnderCap({
    name: `Racer ${index}`,
    email: `racer-${index}@mail.com`,
    passwordHash,
    cap: CREW_LEAD_CAP,
  });
}

// 1. Three crew via makeCrew, then createCrewLead → 409, count stays 3.
// 2. Two seated; two concurrent createCrewLeadIfUnderCap → one ok, one 409, count 3.
// 3. Empty roster; four concurrent creates → exactly three succeed, one 409.
describe("crew lead cap", () => {
  beforeAll(async () => {
    await ensureCatalog();
  });

  beforeEach(async () => {
    await resetTransactionalData();
  });

  it("rejects a fourth crew lead", async () => {
    await makeCrew("one@mail.com");
    await makeCrew("two@mail.com");
    await makeCrew("three@mail.com");

    await expect(
      createCrewLead({
        name: "Fourth",
        email: "four@mail.com",
        password: "bridge-7",
      }),
    ).rejects.toMatchObject({ status: 409 } satisfies Partial<HttpError>);

    const listed = await listCrewLeads();
    expect(listed.count).toBe(CREW_LEAD_CAP);
    expect(listed.cap).toBe(CREW_LEAD_CAP);
  });

  it("lets only one of two concurrent creates through when two seats are filled", async () => {
    await makeCrew("one@mail.com");
    await makeCrew("two@mail.com");

    const attempts = await Promise.allSettled([underCap(1), underCap(2)]);
    const ok = attempts.filter((item) => item.status === "fulfilled");
    const blocked = attempts.filter((item) => item.status === "rejected");

    expect(ok).toHaveLength(1);
    expect(blocked).toHaveLength(1);
    expect((blocked[0] as PromiseRejectedResult).reason).toMatchObject({
      status: 409,
    });

    const listed = await listCrewLeads();
    expect(listed.count).toBe(CREW_LEAD_CAP);
  });

  it("keeps the cap when four creates race from an empty roster", async () => {
    const attempts = await Promise.allSettled([
      underCap(1),
      underCap(2),
      underCap(3),
      underCap(4),
    ]);

    const ok = attempts.filter((item) => item.status === "fulfilled");
    const blocked = attempts.filter((item) => item.status === "rejected");

    expect(ok).toHaveLength(CREW_LEAD_CAP);
    expect(blocked).toHaveLength(1);
    expect((blocked[0] as PromiseRejectedResult).reason).toMatchObject({
      status: 409,
    });

    const listed = await listCrewLeads();
    expect(listed.count).toBe(CREW_LEAD_CAP);
  });
});
