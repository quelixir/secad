/*
  Warnings:

  - You are about to drop the column `companyId` on the `members` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `security_classes` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the `companies` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[entityId,memberNumber]` on the table `members` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[entityId,name]` on the table `security_classes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `entityId` to the `members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entityId` to the `security_classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entityId` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "members" DROP CONSTRAINT "members_companyId_fkey";

-- DropForeignKey
ALTER TABLE "security_classes" DROP CONSTRAINT "security_classes_companyId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_companyId_fkey";

-- DropIndex
DROP INDEX "members_companyId_memberNumber_key";

-- DropIndex
DROP INDEX "security_classes_companyId_name_key";

-- AlterTable
ALTER TABLE "members" DROP COLUMN "companyId",
ADD COLUMN     "entityId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "security_classes" DROP COLUMN "companyId",
ADD COLUMN     "entityId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "companyId",
ADD COLUMN     "entityId" TEXT NOT NULL;

-- DropTable
DROP TABLE "companies";

-- CreateTable
CREATE TABLE "entities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abn" TEXT,
    "acn" TEXT,
    "entityType" TEXT NOT NULL,
    "incorporationDate" TIMESTAMP(3),
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postcode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Australia',
    "status" TEXT NOT NULL DEFAULT 'Active',
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "entities_abn_key" ON "entities"("abn");

-- CreateIndex
CREATE UNIQUE INDEX "entities_acn_key" ON "entities"("acn");

-- CreateIndex
CREATE UNIQUE INDEX "members_entityId_memberNumber_key" ON "members"("entityId", "memberNumber");

-- CreateIndex
CREATE UNIQUE INDEX "security_classes_entityId_name_key" ON "security_classes"("entityId", "name");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_classes" ADD CONSTRAINT "security_classes_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
