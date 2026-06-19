-- Sprint 11: Plans (Social Invites)
-- Creates plans, plan_applications, plan_confirmations tables + all required enums

-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE "PlanCategory" AS ENUM (
  'DINNER', 'LUNCH', 'BREAKFAST', 'BRUNCH',
  'SPA', 'SALON', 'SHOPPING',
  'BADMINTON', 'SPORTS', 'GAMING'
);

CREATE TYPE "PlanStatus" AS ENUM (
  'OPEN', 'FILLED', 'CANCELLED', 'COMPLETED', 'EXPIRED', 'NO_SHOW'
);

CREATE TYPE "PlanVibe" AS ENUM (
  'CASUAL', 'PREMIUM', 'QUICK', 'WEEKEND'
);

CREATE TYPE "PlanVisibility" AS ENUM (
  'PUBLIC', 'PRIVATE'
);

CREATE TYPE "GenderPref" AS ENUM (
  'MALE', 'FEMALE', 'NON_BINARY', 'ANY'
);

CREATE TYPE "ApplicationStatus" AS ENUM (
  'PENDING', 'SELECTED', 'REJECTED', 'WITHDRAWN'
);

-- ─── plans ────────────────────────────────────────────────────────────────────

CREATE TABLE "plans" (
  "id"                   TEXT         NOT NULL,
  "organizerId"          TEXT         NOT NULL,
  "category"             "PlanCategory" NOT NULL,
  "merchantId"           TEXT         NOT NULL,
  "merchantName"         TEXT         NOT NULL,
  "rezBookingRef"        TEXT         NOT NULL,
  "title"                VARCHAR(120) NOT NULL,
  "scheduledAt"          TIMESTAMP(3) NOT NULL,
  "expiresAt"            TIMESTAMP(3) NOT NULL,
  "confirmationDeadline" TIMESTAMP(3) NOT NULL,
  "city"                 TEXT         NOT NULL,
  "genderPreference"     "GenderPref"     NOT NULL DEFAULT 'ANY',
  "ageMin"               INTEGER      NOT NULL DEFAULT 18,
  "ageMax"               INTEGER      NOT NULL DEFAULT 60,
  "capacity"             INTEGER      NOT NULL DEFAULT 1,
  "visibility"           "PlanVisibility" NOT NULL DEFAULT 'PUBLIC',
  "verifiedOnly"         BOOLEAN      NOT NULL DEFAULT false,
  "status"               "PlanStatus"     NOT NULL DEFAULT 'OPEN',
  "reselectionCount"     INTEGER      NOT NULL DEFAULT 0,
  "maxReselections"      INTEGER      NOT NULL DEFAULT 2,
  "applicantCount"       INTEGER      NOT NULL DEFAULT 0,
  "viewsCount"           INTEGER      NOT NULL DEFAULT 0,
  "vibe"                 "PlanVibe",
  "boostedUntil"         TIMESTAMP(3),
  "matchId"              TEXT,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "plans_pkey"             PRIMARY KEY ("id"),
  CONSTRAINT "plans_rezBookingRef_key" UNIQUE ("rezBookingRef")
);

CREATE INDEX "plans_city_status_scheduledAt_idx" ON "plans" ("city", "status", "scheduledAt");
CREATE INDEX "plans_organizerId_idx"             ON "plans" ("organizerId");

-- ─── plan_applications ────────────────────────────────────────────────────────

CREATE TABLE "plan_applications" (
  "id"          TEXT                NOT NULL,
  "planId"      TEXT                NOT NULL,
  "applicantId" TEXT                NOT NULL,
  "note"        VARCHAR(500),
  "score"       DOUBLE PRECISION    NOT NULL DEFAULT 0,
  "status"      "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
  "selectedAt"  TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "plan_applications_pkey"                  PRIMARY KEY ("id"),
  CONSTRAINT "plan_applications_planId_applicantId_key" UNIQUE ("planId", "applicantId")
);

CREATE INDEX "plan_applications_planId_status_idx" ON "plan_applications" ("planId", "status");
CREATE INDEX "plan_applications_applicantId_idx"   ON "plan_applications" ("applicantId");

-- ─── plan_confirmations ───────────────────────────────────────────────────────

CREATE TABLE "plan_confirmations" (
  "id"          TEXT         NOT NULL,
  "planId"      TEXT         NOT NULL,
  "profileId"   TEXT         NOT NULL,
  "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "plan_confirmations_pkey"                PRIMARY KEY ("id"),
  CONSTRAINT "plan_confirmations_planId_profileId_key" UNIQUE ("planId", "profileId")
);

-- ─── Foreign keys ─────────────────────────────────────────────────────────────

ALTER TABLE "plans"
  ADD CONSTRAINT "plans_organizerId_fkey"
  FOREIGN KEY ("organizerId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "plan_applications"
  ADD CONSTRAINT "plan_applications_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "plan_applications"
  ADD CONSTRAINT "plan_applications_applicantId_fkey"
  FOREIGN KEY ("applicantId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "plan_confirmations"
  ADD CONSTRAINT "plan_confirmations_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── updatedAt trigger ────────────────────────────────────────────────────────
-- Keeps plans.updatedAt current automatically (Prisma @updatedAt equivalent)

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "plans_updated_at"
  BEFORE UPDATE ON "plans"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
