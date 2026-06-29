-- CreateTable (baseline — tables already exist from Swift server, IF NOT EXISTS is safe)
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "apple_subject_id" TEXT,
    "google_subject_id" TEXT,
    "display_name" TEXT NOT NULL DEFAULT 'Aura User',
    "email" TEXT,
    "password_hash" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "friendships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "requester_id" UUID NOT NULL,
    "receiver_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "synced_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "date" TIMESTAMPTZ NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT "synced_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
