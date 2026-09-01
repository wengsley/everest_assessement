/**
 * Shared Prisma client used by all data-access models.
 * @author wengsley
 */

import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
