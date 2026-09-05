import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { RESOURCE_STATUS, USAGE_OUTCOME } from "../src/utils/status.js";

const prisma = new PrismaClient();
const passwordHash = bcrypt.hashSync("bridge-7", 10);

async function main() {
  await prisma.usageEvent.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.roleUser.deleteMany();
  await prisma.user.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.role.deleteMany();

  const [crewLead, passenger] = await Promise.all([
    prisma.role.create({ data: { key: "CREW_LEAD", name: "Crew Lead" } }),
    prisma.role.create({ data: { key: "PASSENGER", name: "Passenger" } }),
  ]);

  const [silver, gold, platinum] = await Promise.all([
    prisma.membership.create({
      data: { key: "SILVER", name: "Silver", rank: 0 },
    }),
    prisma.membership.create({
      data: { key: "GOLD", name: "Gold", rank: 1 },
    }),
    prisma.membership.create({
      data: { key: "PLATINUM", name: "Platinum", rank: 2 },
    }),
  ]);

  const membershipByKey = {
    SILVER: silver,
    GOLD: gold,
    PLATINUM: platinum,
  };

  const crew = [
    { name: "Captain Imani Cole", email: "captain@mail.com" },
    { name: "Navigator Sol Park", email: "navigator@mail.com" },
    { name: "Chief Medic Rhea Voss", email: "medic@mail.com" },
  ];

  for (const person of crew) {
    await prisma.user.create({
      data: {
        name: person.name,
        email: person.email.toLowerCase(),
        passwordHash,
        roleUsers: { create: { roleId: crewLead.id } },
      },
    });
  }

  const passengers = [
    { name: "Ada Mercer", email: "ada.silver@mail.com", level: "SILVER" as const },
    { name: "Rio Chen", email: "rio.silver@mail.com", level: "SILVER" as const },
    { name: "Kai Okonkwo", email: "kai.gold@mail.com", level: "GOLD" as const },
    { name: "Jun Hale", email: "jun.gold@mail.com", level: "GOLD" as const },
    { name: "Nova Ellis", email: "nova.platinum@mail.com", level: "PLATINUM" as const },
  ];

  for (const person of passengers) {
    await prisma.user.create({
      data: {
        name: person.name,
        email: person.email.toLowerCase(),
        passwordHash,
        membershipId: membershipByKey[person.level].id,
        roleUsers: { create: { roleId: passenger.id } },
      },
    });
  }

  const resources = [
    { name: "Food Stations", family: "Food Supply Stations", minLevel: "SILVER" as const },
    { name: "Sleeping Pods", family: "Sleeping Pods", minLevel: "SILVER" as const },
    { name: "Basic Hygiene", family: "Hygiene Pods", minLevel: "SILVER" as const },
    { name: "Private Cabins", family: "Sleeping (private)", minLevel: "GOLD" as const },
    { name: "Adv. Medical Bay", family: "Medical Bays", minLevel: "GOLD" as const },
    { name: "Luxury O2 Pods", family: "Oxygen Refill Units", minLevel: "PLATINUM" as const },
    { name: "VIP Rec Deck", family: "Fitness / Rec", minLevel: "PLATINUM" as const },
  ];

  for (const resource of resources) {
    await prisma.resource.create({
      data: {
        name: resource.name,
        family: resource.family,
        minMembershipId: membershipByKey[resource.minLevel].id,
        status: RESOURCE_STATUS.ACTIVE,
      },
    });
  }

  const passengerRows = await prisma.user.findMany({
    where: { roleUsers: { some: { roleId: passenger.id } } },
  });
  const resourceRows = await prisma.resource.findMany();
  const byEmail = Object.fromEntries(passengerRows.map((p) => [p.email, p]));
  const byName = Object.fromEntries(resourceRows.map((r) => [r.name, r]));
  const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000);

  await prisma.usageEvent.createMany({
    data: [
      {
        passengerId: byEmail["ada.silver@mail.com"].id,
        resourceId: byName["Food Stations"].id,
        outcome: USAGE_OUTCOME.ALLOWED,
        startedAt: hoursAgo(18),
        endedAt: hoursAgo(17.5),
      },
      {
        passengerId: byEmail["ada.silver@mail.com"].id,
        resourceId: byName["Sleeping Pods"].id,
        outcome: USAGE_OUTCOME.ALLOWED,
        startedAt: hoursAgo(10),
        endedAt: hoursAgo(2),
      },
      {
        passengerId: byEmail["rio.silver@mail.com"].id,
        resourceId: byName["Basic Hygiene"].id,
        outcome: USAGE_OUTCOME.ALLOWED,
        startedAt: hoursAgo(6),
        endedAt: hoursAgo(5.7),
      },
      {
        passengerId: byEmail["kai.gold@mail.com"].id,
        resourceId: byName["Adv. Medical Bay"].id,
        outcome: USAGE_OUTCOME.ALLOWED,
        startedAt: hoursAgo(12),
        endedAt: hoursAgo(11.2),
      },
      {
        passengerId: byEmail["kai.gold@mail.com"].id,
        resourceId: byName["Food Stations"].id,
        outcome: USAGE_OUTCOME.ALLOWED,
        startedAt: hoursAgo(4),
        endedAt: hoursAgo(3.6),
      },
      {
        passengerId: byEmail["jun.gold@mail.com"].id,
        resourceId: byName["Private Cabins"].id,
        outcome: USAGE_OUTCOME.ALLOWED,
        startedAt: hoursAgo(20),
        endedAt: hoursAgo(8),
      },
      {
        passengerId: byEmail["nova.platinum@mail.com"].id,
        resourceId: byName["Luxury O2 Pods"].id,
        outcome: USAGE_OUTCOME.ALLOWED,
        startedAt: hoursAgo(8),
        endedAt: hoursAgo(7.4),
      },
      {
        passengerId: byEmail["nova.platinum@mail.com"].id,
        resourceId: byName["Luxury O2 Pods"].id,
        outcome: USAGE_OUTCOME.ALLOWED,
        startedAt: hoursAgo(3),
        endedAt: hoursAgo(2.5),
      },
      {
        passengerId: byEmail["nova.platinum@mail.com"].id,
        resourceId: byName["VIP Rec Deck"].id,
        outcome: USAGE_OUTCOME.ALLOWED,
        startedAt: hoursAgo(1.5),
        endedAt: hoursAgo(0.8),
      },
      {
        passengerId: byEmail["nova.platinum@mail.com"].id,
        resourceId: byName["Luxury O2 Pods"].id,
        outcome: USAGE_OUTCOME.ALLOWED,
        startedAt: hoursAgo(0.4),
        endedAt: null,
      },
    ],
  });

  console.log("Seeded roles, memberships, users, and resources.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
