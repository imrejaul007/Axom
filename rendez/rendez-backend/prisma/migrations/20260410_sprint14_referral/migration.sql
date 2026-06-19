-- Sprint 14: Referral system fields on profiles

ALTER TABLE "profiles"
  ADD COLUMN IF NOT EXISTS "inviteCode"    TEXT    UNIQUE DEFAULT gen_random_uuid()::text,
  ADD COLUMN IF NOT EXISTS "referredBy"    TEXT,
  ADD COLUMN IF NOT EXISTS "referralCount" INTEGER NOT NULL DEFAULT 0;

-- Backfill missing invite codes for existing rows (gen_random_uuid already sets default)
UPDATE "profiles" SET "inviteCode" = gen_random_uuid()::text WHERE "inviteCode" IS NULL;
