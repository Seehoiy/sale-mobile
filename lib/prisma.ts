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

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    // 💡 ປ້ອງກັນ Webpack / Next.js Bundler ທົດສອບ Property ຕອນ Build
    if (
      typeof prop === "symbol" ||
      prop === "then" ||
      prop === "$$typeof" ||
      prop === "toJSON"
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