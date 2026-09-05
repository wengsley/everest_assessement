import { prisma } from "../models/prisma.js";

export default async function teardown() {
  await prisma.$disconnect();
}
