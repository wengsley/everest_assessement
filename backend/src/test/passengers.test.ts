import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MEMBERSHIP_KEY } from "../utils/catalog.js";
import { login } from "../services/authService.js";
import { changePassengerLevel } from "../services/passengersService.js";
import { useResource } from "../services/resourcesService.js";
import { getMyHistory } from "../services/usageService.js";
import { HttpError } from "../utils/errors.js";
import {
  ensureCatalog,
  makePassenger,
  makeResource,
  resetTransactionalData,
} from "./fixtures.js";

// 1. Silver passenger + wrong password → login throws HttpError.
// 2. Gold passenger + bridge-7 → JWT string and level GOLD.
// 3. Platinum starts O2 (Platinum) and Food (Silver), then downgrade to Silver.
//    O2 session gets endedAt; Food stays open.
describe("auth and passenger flows", () => {
  beforeAll(async () => {
    await ensureCatalog();
  });

  beforeEach(async () => {
    await resetTransactionalData();
  });

  it("rejects a bad password", async () => {
    await makePassenger(MEMBERSHIP_KEY.SILVER, "ada@mail.com");
    await expect(
      login({ email: "ada@mail.com", password: "wrong-password" }),
    ).rejects.toBeInstanceOf(HttpError);
  });

  it("issues a token for a valid login", async () => {
    await makePassenger(MEMBERSHIP_KEY.GOLD, "kai@mail.com");
    const result = await login({
      email: "kai@mail.com",
      password: "bridge-7",
    });
    expect(result.token).toEqual(expect.any(String));
    expect(result.user.level).toBe(MEMBERSHIP_KEY.GOLD);
  });

  it("ends open sessions that the new tier cannot use", async () => {
    const nova = await makePassenger(
      MEMBERSHIP_KEY.PLATINUM,
      "nova@mail.com",
    );
    const o2 = await makeResource({
      minLevel: MEMBERSHIP_KEY.PLATINUM,
      name: "Luxury O2",
    });
    const food = await makeResource({
      minLevel: MEMBERSHIP_KEY.SILVER,
      name: "Food",
    });

    await useResource(nova.id, o2.id);
    await useResource(nova.id, food.id);

    await changePassengerLevel(nova.id, { level: MEMBERSHIP_KEY.SILVER });

    const { history } = await getMyHistory(nova.id);
    const o2Session = history.find((event) => event.resource.name === "Luxury O2");
    const foodSession = history.find((event) => event.resource.name === "Food");

    expect(o2Session?.endedAt).toEqual(expect.any(String));
    expect(foodSession?.endedAt).toBeNull();
  });
});
