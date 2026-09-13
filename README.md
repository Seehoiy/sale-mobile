# IMEI•DESK — ລະບົບ POS ຮ້ານໂທລະສັບ Multi-Branch

Next.js 14 (App Router) + TypeScript + PostgreSQL + Prisma ORM

ຄອບຄຸມ: IMEI/Serial Tracking ເຕັມວົງຈອນ, ຮັບເທິນເຄື່ອງເກົ່າ (Trade-in + KYC), ຮັບຊ່ອມ (Repair Job Ticket),
ປະກັນ/ເຄລມ (Warranty & Claim ພ້ອມ Swap IMEI), ໂອນຍ້າຍສາຂາ, ແລະ ໜ້າຂາຍ POS.

## 1. ສິ່ງທີ່ຕ້ອງມີກ່ອນ

- Node.js 18.18+ (ແນະນຳ 20 LTS)
- PostgreSQL 14+ (local ຫຼື cloud ເຊັ່ນ Supabase/Neon/Railway)
- npm

## 2. ຕິດຕັ້ງ

```bash
cd phone-shop-pos
npm install
```

## 3. ຕັ້ງຄ່າຖານຂໍ້ມູນ

ຄັດລອກ `.env.example` ເປັນ `.env` ແລ້ວແກ້ໄຂ `DATABASE_URL` ໃຫ້ຕົງກັບ PostgreSQL ຂອງທ່ານ:

```bash
cp .env.example .env
```

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/phone_shop_pos?schema=public"
```

## 4. ສ້າງຕາຕະລາງ + Prisma Client

```bash
npx prisma migrate dev --name init
npm run prisma:generate
```

## 5. ໃສ່ຂໍ້ມູນຕົວຢ່າງ (2 ສາຂາ, ພະນັກງານ, ສິນຄ້າ, IMEI ຕົວຢ່າງ)

```bash
npm run seed
```

## 6. ລັນລະບົບ

```bash
npm run dev
```

ເປີດ http://localhost:3000 — ຈະພາໄປໜ້າ **Log In** ອັດໂນມັດ (ດັ່ງໜ້າ SabuySoft):

| User Name | Password | Role |
|---|---|---|
| `admin` | `admin123` | ADMIN |
| `cashier1` | `cashier123` | CASHIER |

ຫຼັງ Log In ສຳເລັດ ຈະໄປໜ້າ **Menu ຫຼັກແບບໄອຄອນ** (`/menu`) — ກົດໄອຄອນເພື່ອເຂົ້າແຕ່ລະໜ້າວຽກ.

> ⚠️ **ໝາຍເຫດ auth**: prototype ນີ້ໃຊ້ session ແບບເກັບໄວ້ໃນ `localStorage` ຂອງ browser ເທົ່ານັ້ນ
> (ເບິ່ງ `lib/session.ts`) ແລະ ປຽບທຽບລະຫັດຜ່ານແບບ plain-text (ເບິ່ງ `app/api/auth/login/route.ts`).
> ນີ້ບໍ່ປອດໄພສຳລັບ production — ຕ້ອງປ່ຽນເປັນ server session/JWT ພ້ອມ `bcrypt` hashing ກ່ອນຂຶ້ນໃຊ້ຈິງ.


## ຂະບວນການໃຊ້ງານທີ່ຖືກຕ້ອງ (Workflow)

ຂໍ້ຜິດພາດທີ່ພົບເລື້ອຍທີ່ສຸດ: ຄົ້ນຫາ IMEI ໃນໜ້າ Sell ແລ້ວ**ບໍ່ພົບຫຍັງ**. ສາເຫດ: IMEI ນັ້ນຍັງບໍ່ທັນຖືກ
"ຮັບເຂົ້າສາງ" ໃນລະບົບ — ຄົ້ນຫາຈະສະແດງສະເພາະ IMEI ທີ່ຢູ່ໃນຖານຂໍ້ມູນ ແລະ ສະຖານະ `IN_STOCK` ຢູ່ສາຂາທີ່ login ຢູ່ເທົ່ານັ້ນ.

ຂະບວນການທີ່ຖືກຕ້ອງມີ 3 ຂັ້ນຕອນ:

1. **ສ້າງລຸ້ນສິນຄ້າ** (ໜ້າ `/products`) — ຖ້າຍັງບໍ່ມີລຸ້ນນັ້ນໃນລະບົບ
2. **ຮັບເຄື່ອງເຂົ້າສາງ** (ໜ້າ `/receive`, icon "Buy" ໃນ Menu) — ໃສ່ IMEI ຈິງຂອງເຄື່ອງ ແລ້ວກົດຮັບເຂົ້າສາງ
3. **ຂາຍ** (ໜ້າ `/pos`) — ຄົ້ນຫາ IMEI ນັ້ນ ຈະເຫັນທັນທີ ແລະ ຂາຍໄດ້

ຂໍ້ມູນຕົວຢ່າງຈາກ `npm run seed` ມີ IMEI ຕົວຢ່າງພຽງ 2 ໜ່ວຍ ຢູ່ສາຂາ VTE-01 ເທົ່ານັ້ນ (ໃຊ້ທົດລອງ Sell
ໄດ້ທັນທີ) — IMEI ອື່ນທັງໝົດຕ້ອງຜ່ານຂັ້ນຕອນ "ຮັບເຄື່ອງເຂົ້າສາງ" ກ່ອນ.


## ໜ້າຕ່າງໆໃນລະບົບ

| ໜ້າ | ໜ້າທີ່ |
|---|---|
| `/login` | ໜ້າເຂົ້າສູ່ລະບົບ ແບບ SabuySoft (ເລືອກ Connection/ສາຂາ) |
| `/menu` | ໜ້າ Menu ຫຼັກແບບໄອຄອນ |
| `/dashboard` | ພາບລວມທຸລະກິດ |
| `/pos` | ໜ້າຂາຍ (Sell) ແບບຕາຕະລາງ — ຄົ້ນຫາ IMEI, ອອກໃບບິນ, ຕັດສະຕັອກ+ເລີ່ມນັບປະກັນອັດໂນມັດ |
| `/receive` | **ຮັບເຄື່ອງເຂົ້າສາງ (Buy)** — ຂັ້ນຕອນທຳອິດທີ່ຕ້ອງເຮັດກ່ອນ IMEI ຈະປາກົດຢູ່ໜ້າ Sell ໄດ້ |
| `/inventory` | ຄົ້ນຫາ/ກັ່ນຕອງ IMEI ຕາມສາຂາ ແລະ ສະຖານະ |
| `/products` | ຈັດການສິນຄ້າ/ລຸ້ນ — ເພີ່ມ, ແກ້ໄຂລາຄາ, ເປີດ/ປິດການຂາຍ, ເພີ່ມໝວດໝູ່/ຍີ່ຫໍ້ໃໝ່ |
| `/trade-in` | ບັນທຶກການປະເມີນຮັບເທິນ + ແປງເປັນສະຕັອກ second-hand |
| `/repair` | ອອກໃບຮັບຊ່ອມ + kanban board ຕິດຕາມສະຖານະ |
| `/transfers` | ຂໍໂອນ IMEI ລະຫວ່າງສາຂາ + ຢືນຢັນຮັບເຄື່ອງ |
| `/branches` | ຈັດການສາຂາ ແລະ ພະນັກງານ — ເພີ່ມ, ແກ້ໄຂ, ເປີດ/ປິດການໃຊ້ງານ |

## ໂຄງສ້າງໂຟນເດີ

```
prisma/schema.prisma        ← ຖານຂໍ້ມູນທັງໝົດ (IMEI, ສາຂາ, ຂາຍ, ຊ່ອມ, ປະກັນ...)
prisma/seed.ts               ← ຂໍ້ມູນຕົວຢ່າງ
lib/prisma.ts                ← Prisma client singleton
lib/utils.ts                 ← ຟັງຊັນຊ່ວຍ (ເລກທີໃບບິນ, ຮູບແບບເງິນ)
app/api/**                   ← API routes (ທຸກ business logic + transaction)
app/**/page.tsx              ← ໜ້າ UI
components/**                ← ອົງປະກອບຮ່ວມ (Sidebar, StatusBadge, ImeiChip)
```

## ຈຸດສຳຄັນຂອງ business logic (ຢູ່ໃນ API routes)

- **POST `/api/sales`** — ຫຸ້ມທຸກຢ່າງໃນ `prisma.$transaction`: ກວດ IMEI ວ່າພ້ອມຂາຍ → ອອກໃບບິນ →
  ປ່ຽນ `InventoryItem.status` ເປັນ `SOLD` → ບັນທຶກ `ImeiHistory` → ເປີດປະກັນຮ້ານອັດໂນມັດ.
- **POST `/api/trade-in/:id/convert`** — ແປງລາຍການປະເມີນທີ່ຮັບແລ້ວ ໃຫ້ກາຍເປັນ `InventoryItem`
  ໃໝ່ ສະຖານະ `SECOND_HAND` ຢູ່ສາຂາທີ່ຮັບເທິນ.
- **POST `/api/transfers`** ແລະ **POST `/api/transfers/:id/receive`** — ສະຖານະ IMEI ປ່ຽນ
  `IN_STOCK → TRANSFER_OUT → IN_STOCK` (ຢູ່ສາຂາໃໝ່) ພ້ອມປະຫວັດຄົບຖ້ວນ.
- **PATCH `/api/claims/:id`** — ຮອງຮັບ `SWAPPED` ເພື່ອປ່ຽນ IMEI ໃໝ່ໃຫ້ລູກຄ້າ (ຕັດ IMEI ໃໝ່ອອກຈາກສະຕັອກ,
  ປິດ IMEI ເກົ່າ).

## ຂໍ້ຄວນຮູ້ / ຂັ້ນຕອນຕໍ່ໄປສຳລັບ production

- ຍັງບໍ່ມີລະບົບ authentication ຈິງ (login/session/JWT) — password ໃນ prototype ນີ້ເກັບ/ປຽບທຽບແບບ
  plain-text, ຕ້ອງ hash ດ້ວຍ `bcrypt` ແລະ ເພີ່ມ NextAuth ຫຼືລະບົບ session ຂອງທ່ານເອງກ່ອນຂຶ້ນໃຊ້ຈິງ.
- ຮູບພາບ (KYC, ສະພາບເຄື່ອງ) ຕອນນີ້ຮັບເປັນ URL string — ຄວນຕໍ່ກັບ S3/Cloudinary ຫຼື object storage ອື່ນ
  ແລ້ວສົ່ງ URL ເຂົ້າມາ.
- ຄວນເພີ່ມ role-based permission (ADMIN/MANAGER/CASHIER/TECHNICIAN/WAREHOUSE ມີໃນ schema ແລ້ວ
  ແຕ່ຍັງບໍ່ໄດ້ບັງຄັບໃຊ້ຢູ່ໃນ API — ຕອນນີ້ໃຜ login ໄດ້ກໍແກ້ໄຂຂໍ້ມູນ ໜ້າ /branches ແລະ /products ໄດ້ໝົດ).
- ໜ້າ `/branches` ແລະ `/products` ຮອງຮັບ ສ້າງ/ແກ້ໄຂ/ເປີດ-ປິດ ແລ້ວ (ບໍ່ມີການລຶບຖາວອນ ເພື່ອຮັກສາ
  ຄວາມສົມບູນຂອງປະຫວັດ/ໃບບິນເກົ່າທີ່ອ້າງອີງເຖິງ). ຖ້າຕ້ອງການ hard-delete ຕ້ອງເຮັດຜ່ານ Prisma Studio.
- ຄວນເພີ່ມ pagination ໃນໜ້າ inventory/sales/products ເມື່ອຂໍ້ມູນຫຼາຍຂຶ້ນ.
