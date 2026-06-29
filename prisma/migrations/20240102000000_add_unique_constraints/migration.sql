-- AddUniqueIndex on apple_subject_id and google_subject_id
CREATE UNIQUE INDEX IF NOT EXISTS "users_apple_subject_id_key" ON "users"("apple_subject_id");
CREATE UNIQUE INDEX IF NOT EXISTS "users_google_subject_id_key" ON "users"("google_subject_id");

-- Set default value for display_name
ALTER TABLE "users" ALTER COLUMN "display_name" SET DEFAULT 'Aura User';
