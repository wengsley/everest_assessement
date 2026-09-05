import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createCrewLead, listCrewLeads } from "../services/crewLeadsService.js";
import { HttpError } from "../utils/errors.js";
import {
  ensureCatalog,
  makeCrew,
  resetTransactionalData,
} from "./fixtures.js";

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
    expect(listed.count).toBe(3);
    expect(listed.cap).toBe(3);
  });

  it("lets only one of two concurrent creates through when two seats remain filled", async () => {
    await makeCrew("one@mail.com");
    await makeCrew("two@mail.com");

    const attempts = await Promise.allSettled([
      createCrewLead({
        name: "Racer A",
        email: "racer-a@mail.com",
        password: "bridge-7",
      }),
      createCrewLead({
        name: "Racer B",
        email: "racer-b@mail.com",
        password: "bridge-7",
      }),
    ]);

    const ok = attempts.filter((item) => item.status === "fulfilled");
    const blocked = attempts.filter((item) => item.status === "rejected");

    expect(ok).toHaveLength(1);
    expect(blocked).toHaveLength(1);
    expect((blocked[0] as PromiseRejectedResult).reason).toMatchObject({
      status: 409,
    });

    const listed = await listCrewLeads();
    expect(listed.count).toBe(3);
  });
});
