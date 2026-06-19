-- Sprint 5 schema additions
-- Run with: npx prisma migrate deploy

-- Profile: isSuspended flag for admin suspension flow
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "isSuspended" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "profiles_isSuspended_idx" ON "profiles"("isSuspended");

-- Message: matchId for direct match lookup without joining MessageState
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "matchId" TEXT;
UPDATE "messages" m
  SET "matchId" = ms."matchId"
  FROM "message_states" ms
  WHERE m."stateId" = ms.id;
ALTER TABLE "messages" ALTER COLUMN "matchId" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "messages_matchId_idx" ON "messages"("matchId");

-- Message: read receipt flag
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "read" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "messages_read_idx" ON "messages"("read") WHERE "read" = false;
