import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 ກຳລັງໃສ່ຂໍ້ມູນຕົວຢ່າງ...");

  const [vte, pakse] = await Promise.all([
    prisma.branch.upsert({
      where: { code: "VTE-01" },
      update: {},
      create: { code: "VTE-01", name: "ສາຂາວຽງຈັນ (ໃຈກາງ)", address: "ຖະໜົນລ້ານຊ້າງ, ວຽງຈັນ", phone: "020-5555-0001" },
    }),
    prisma.branch.upsert({
      where: { code: "PKS-01" },
      update: {},
      create: { code: "PKS-01", name: "ສາຂາປາກເຊ", address: "ຖະໜົນເລກ 13, ປາກເຊ", phone: "020-5555-0002" },
    }),
  ]);  

  const admin = await prisma.employee.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      empCode: "ADMIN001",
      username: "admin",
      passwordHash: "admin123", // ⚠️ Prototype ເທົ່ານັ້ນ: plain-text. Production ຕ້ອງ hash ດ້ວຍ bcrypt.
      fullName: "ຜູ້ຄຸ້ມຄອງລະບົບ",
      role: "ADMIN",
      branchId: vte.id,
    },
  });

  const cashier = await prisma.employee.upsert({
    where: { username: "cashier1" },
    update: {},
    create: {
      empCode: "CASHIER001",
      username: "cashier1",
      passwordHash: "cashier123", // ⚠️ Prototype ເທົ່ານັ້ນ: plain-text. Production ຕ້ອງ hash ດ້ວຍ bcrypt.
      fullName: "ພະນັກງານຂາຍ ວຽງຈັນ",
      role: "CASHIER",
      branchId: vte.id,
    },
  });

  const phoneCategory = await prisma.category.upsert({
    where: { name: "ໂທລະສັບ" },
    update: {},
    create: { name: "ໂທລະສັບ" },
  });
  const accessoryCategory = await prisma.category.upsert({
    where: { name: "ອຸປະກອນເສີມ" },
    update: {},
    create: { name: "ອຸປະກອນເສີມ" },
  });
  const partsCategory = await prisma.category.upsert({
    where: { name: "ອາໄຫຼ່" },
    update: {},
    create: { name: "ອາໄຫຼ່" },
  });

  const apple = await prisma.brand.upsert({
    where: { name: "Apple" },
    update: {},
    create: { name: "Apple" },
  });
  const samsung = await prisma.brand.upsert({
    where: { name: "Samsung" },
    update: {},
    create: { name: "Samsung" },
  });

  const iphone = await prisma.product.upsert({
    where: { sku: "IP15PM-256-NT" },
    update: {},
    create: {
      sku: "IP15PM-256-NT",
      name: "iPhone 15 Pro Max 256GB Natural Titanium",
      brandId: apple.id,
      categoryId: phoneCategory.id,
      trackingType: "SERIALIZED",
      attributes: { storage: "256GB", color: "Natural Titanium" },
      costPrice: 11500000,
      sellPrice: 13900000,
    },
  });

  const galaxy = await prisma.product.upsert({
    where: { sku: "SGS24-256-BLK" },
    update: {},
    create: {
      sku: "SGS24-256-BLK",
      name: "Samsung Galaxy S24 256GB Onyx Black",
      brandId: samsung.id,
      categoryId: phoneCategory.id,
      trackingType: "SERIALIZED",
      attributes: { storage: "256GB", color: "Onyx Black" },
      costPrice: 7200000,
      sellPrice: 8900000,
    },
  });

  const tempered = await prisma.product.upsert({
    where: { sku: "ACC-GLASS-UNI" },
    update: {},
    create: {
      sku: "ACC-GLASS-UNI",
      name: "ຟິມກະຈົກ ນິລະໄພ (Universal)",
      categoryId: accessoryCategory.id,
      trackingType: "QUANTITY",
      costPrice: 15000,
      sellPrice: 50000,
    },
  });

  const battery = await prisma.product.upsert({
    where: { sku: "PART-BATT-IP15" },
    update: {},
    create: {
      sku: "PART-BATT-IP15",
      name: "ແບັດເຕີຣີ iPhone 15 (ອາໄຫຼ່)",
      categoryId: partsCategory.id,
      trackingType: "QUANTITY",
      costPrice: 250000,
      sellPrice: 450000,
    },
  });

  // ສະຕັອກແບບນັບຈຳນວນ ສຳລັບສາຂາວຽງຈັນ
  await prisma.branchStock.upsert({
    where: { branchId_productId: { branchId: vte.id, productId: tempered.id } },
    update: { quantity: 40 },
    create: { branchId: vte.id, productId: tempered.id, quantity: 40, reorderLevel: 10 },
  });
  await prisma.branchStock.upsert({
    where: { branchId_productId: { branchId: vte.id, productId: battery.id } },
    update: { quantity: 15 },
    create: { branchId: vte.id, productId: battery.id, quantity: 15, reorderLevel: 5 },
  });

  // ຕົວຢ່າງ IMEI ໃນສາງ
  const existingImei = await prisma.inventoryItem.findUnique({ where: { imei1: "356789101234561" } });
  if (!existingImei) {
    await prisma.inventoryItem.create({
      data: {
        imei1: "356789101234561",
        imei2: "356789101234562",
        productId: iphone.id,
        currentBranchId: vte.id,
        status: "IN_STOCK",
        condition: "NEW",
        costPrice: iphone.costPrice,
        sourceType: "PURCHASE",
      },
    });
  }

  const existingImei2 = await prisma.inventoryItem.findUnique({ where: { imei1: "356789101234999" } });
  if (!existingImei2) {
    await prisma.inventoryItem.create({
      data: {
        imei1: "356789101234999",
        productId: galaxy.id,
        currentBranchId: vte.id,
        status: "IN_STOCK",
        condition: "NEW",
        costPrice: galaxy.costPrice,
        sourceType: "PURCHASE",
      },
    });
  }

  await prisma.customer.upsert({
    where: { phone: "02055501234" },
    update: {},
    create: { fullName: "ລູກຄ້າຕົວຢ່າງ ສົມສະໄໝ", phone: "02055501234" },
  });

  console.log("✅ ໃສ່ຂໍ້ມູນຕົວຢ່າງສຳເລັດ");
  console.log({ vte: vte.id, pakse: pakse.id, admin: admin.id, cashier: cashier.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
