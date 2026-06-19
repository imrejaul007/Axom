-- Sprint 13: Trust signals — meetupCount on profiles

ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "meetupCount" INTEGER NOT NULL DEFAULT 0;
