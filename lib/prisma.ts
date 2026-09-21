import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }
  return globalForPrisma.prisma;
}

// 💡 ກວດສອບວ່າຢູ່ຕອນ Build Phase ຂອງ Next.js ບໍ
const isBuildPhase =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.IS_BUILD === "true";

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    // 💡 ຖ້າເປັນ Build Phase ຫຼື Webpack ກວດສອບ Module ໃຫ້ Return undefined ທັນທີ (ບໍ່ new PrismaClient)
    if (
      isBuildPhase ||
      typeof prop === "symbol" ||
      [
        "then",
        "$$typeof",
        "toJSON",
        "__esModule",
        "default",
        "constructor",
        "toString",
        "valueOf",
        "inspect",
      ].includes(prop as string)
    ) {
      return undefined;
    }

    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});