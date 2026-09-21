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

// 💡 ລາຍຊື່ Property ທີ່ Webpack / Node.js ໃຊ້ກວດສອບ Module ຕອນ Build
const IGNORED_PROPS = new Set([
  "then",
  "$$typeof",
  "toJSON",
  "__esModule",
  "default",
  "constructor",
  "toString",
  "valueOf",
  "inspect",
]);

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    // 💡 ຖ້າ Webpack ກວດສອບ Metadata Module ຕອນ Build ໃຫ້ Return undefined ທັນທີ (ບໍ່ໃຫ້ new PrismaClient)
    if (typeof prop === "symbol" || IGNORED_PROPS.has(prop as string)) {
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