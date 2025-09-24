-- Safe enum rename for Postgres Role: MOTORISTA -> TRANSPORTADORA
-- 1) Create new enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role_new') THEN
    CREATE TYPE "public"."Role_new" AS ENUM ('EMPRESA','TRANSPORTADORA');
  END IF;
END $$;

-- 2) Alter columns to new enum (casting via text)
ALTER TABLE "User" ALTER COLUMN "role" TYPE "public"."Role_new" USING (
  CASE
    WHEN "role"::text = 'MOTORISTA' THEN 'TRANSPORTADORA'::text
    ELSE "role"::text
  END
)::"public"."Role_new";

-- 3) Drop old enum and rename new to original
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
    DROP TYPE "public"."Role";
  END IF;
END $$;

ALTER TYPE "public"."Role_new" RENAME TO "Role";
