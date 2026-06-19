-- Migration: bugfix schema changes
-- 1. Add GIFT_UNLOCKED to ChatState enum (was missing, causing runtime Prisma errors)
-- 2. Add index on meetup_checkins.bookingId
-- 3. Add index on rewards.bookingId

-- ChatState enum — add missing GIFT_UNLOCKED value
-- PostgreSQL requires ALTER TYPE to add enum values
ALTER TYPE "ChatState" ADD VALUE IF NOT EXISTS 'GIFT_UNLOCKED';

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS "meetup_checkins_bookingId_idx" ON "meetup_checkins"("bookingId");
CREATE INDEX IF NOT EXISTS "rewards_bookingId_idx" ON "rewards"("bookingId");
