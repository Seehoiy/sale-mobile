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

// 💡 ຄູ່ມືປ້ອງກັນ Dummy Proxy ສຳລັບ Next.js Build Phase
const dummyHandler = new Proxy(() => Promise.resolve(null), {
  get() {
    return () => Promise.resolve(null);
  },
});

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    // 💡 ຖ້າຢູ່ຕອນ Build Phase ຂອງ Next.js ຫຼື ບໍ່ມີ DATABASE_URL ເທິງ Vercel
    // ໃຫ້ Return Dummy Handler ທັນທີ ໂດຍບໍ່ new PrismaClient()
    const isBuildPhase =
      process.env.NEXT_PHASE === "phase-production-build" ||
      process.env.IS_BUILD === "true" ||
      !process.env.DATABASE_URL;

    if (isBuildPhase) {
      return dummyHandler;
    }

    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});