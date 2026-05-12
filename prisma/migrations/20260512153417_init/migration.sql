-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('REAL_ESTATE', 'VEHICLE', 'BUSINESS_EQUITY', 'CASH', 'CRYPTO');

-- CreateEnum
CREATE TYPE "OwnershipType" AS ENUM ('DECLARANT', 'SPOUSE', 'JOINT', 'CHILDREN');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('CRITICAL', 'WARNING', 'INFO');

-- CreateTable
CREATE TABLE "Politician" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currentRole" TEXT NOT NULL,
    "partyAffiliation" TEXT NOT NULL,
    "transparencyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Politician_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Declaration" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "submissionDate" TIMESTAMP(3) NOT NULL,
    "totalAssets" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalLiabilities" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalHouseholdIncome" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "politicianId" TEXT NOT NULL,

    CONSTRAINT "Declaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "category" "AssetCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "acquisitionYear" INTEGER NOT NULL,
    "declaredValue" DOUBLE PRECISION NOT NULL,
    "ownership" "OwnershipType" NOT NULL,
    "declarationId" TEXT NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Liability" (
    "id" TEXT NOT NULL,
    "creditor" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "remainingAmount" DOUBLE PRECISION NOT NULL,
    "ownership" "OwnershipType" NOT NULL,
    "declarationId" TEXT NOT NULL,

    CONSTRAINT "Liability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncomeSource" (
    "id" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "annualAmount" DOUBLE PRECISION NOT NULL,
    "ownership" "OwnershipType" NOT NULL,
    "declarationId" TEXT NOT NULL,

    CONSTRAINT "IncomeSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchdogAlert" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "politicianId" TEXT NOT NULL,

    CONSTRAINT "WatchdogAlert_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Declaration" ADD CONSTRAINT "Declaration_politicianId_fkey" FOREIGN KEY ("politicianId") REFERENCES "Politician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "Declaration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Liability" ADD CONSTRAINT "Liability_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "Declaration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeSource" ADD CONSTRAINT "IncomeSource_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "Declaration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchdogAlert" ADD CONSTRAINT "WatchdogAlert_politicianId_fkey" FOREIGN KEY ("politicianId") REFERENCES "Politician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
