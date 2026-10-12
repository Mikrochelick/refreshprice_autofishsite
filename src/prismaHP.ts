import { PrismaClient } from ".prisma/hp-client";

export const prismaHP = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_HP_URL,
    },
  },
});
