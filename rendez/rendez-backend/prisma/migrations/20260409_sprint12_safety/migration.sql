-- Sprint 12: Chat Request Model + Female Safety Controls
-- Adds safety toggle columns to profiles, creates message_requests table

-- ─── Profile safety columns ────────────────────────────────────────────────

ALTER TABLE "profiles"
  ADD COLUMN IF NOT EXISTS "requireMessageRequest" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "verifiedOnly"          BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "onlyVerifiedCanLike"   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "shadowScore"           DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "responseRate"          DOUBLE PRECISION NOT NULL DEFAULT 1.0;

-- ─── MessageRequestStatus enum ────────────────────────────────────────────

CREATE TYPE "MessageRequestStatus" AS ENUM (
  'PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED'
);

-- ─── message_requests ─────────────────────────────────────────────────────

CREATE TABLE "message_requests" (
  "id"          TEXT                    NOT NULL,
  "matchId"     TEXT                    NOT NULL,
  "senderId"    TEXT                    NOT NULL,
  "receiverId"  TEXT                    NOT NULL,
  "previewText" VARCHAR(200)            NOT NULL,
  "status"      "MessageRequestStatus"  NOT NULL DEFAULT 'PENDING',
  "createdAt"   TIMESTAMP(3)            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "respondedAt" TIMESTAMP(3),

  CONSTRAINT "message_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "message_requests_matchId_senderId_key" UNIQUE ("matchId", "senderId")
);

CREATE INDEX "message_requests_receiverId_status_idx" ON "message_requests" ("receiverId", "status");
CREATE INDEX "message_requests_matchId_idx"           ON "message_requests" ("matchId");

-- ─── Foreign keys ─────────────────────────────────────────────────────────

ALTER TABLE "message_requests"
  ADD CONSTRAINT "message_requests_senderId_fkey"
  FOREIGN KEY ("senderId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "message_requests"
  ADD CONSTRAINT "message_requests_receiverId_fkey"
  FOREIGN KEY ("receiverId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
