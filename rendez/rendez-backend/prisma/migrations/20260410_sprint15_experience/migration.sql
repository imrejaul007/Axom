-- Sprint 15: Experience Credits from REZ spending rewards

CREATE TYPE "ExperienceTier" AS ENUM ('SILVER', 'GOLD', 'PLATINUM');
CREATE TYPE "ExperienceCreditType" AS ENUM ('COFFEE_BRUNCH', 'DINNER_FOR_TWO', 'PREMIUM_EXPERIENCE');
CREATE TYPE "ExperienceCreditStatus" AS ENUM ('AVAILABLE', 'USED', 'EXPIRED');

CREATE TABLE IF NOT EXISTS "experience_credits" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "profileId"    TEXT NOT NULL,
  "rezUserId"    TEXT NOT NULL,
  "rezRewardId"  TEXT NOT NULL,
  "tier"         "ExperienceTier" NOT NULL,
  "type"         "ExperienceCreditType" NOT NULL,
  "label"        TEXT NOT NULL,
  "status"       "ExperienceCreditStatus" NOT NULL DEFAULT 'AVAILABLE',
  "expiresAt"    TIMESTAMP(3) NOT NULL,
  "usedInPlanId" TEXT,
  "grantedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "experience_credits_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "experience_credits" ADD CONSTRAINT "experience_credits_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "experience_credits_rezRewardId_key" ON "experience_credits"("rezRewardId");
CREATE INDEX "experience_credits_profileId_status_idx" ON "experience_credits"("profileId", "status");

ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "isExperiencePlan" BOOLEAN NOT NULL DEFAULT false;
