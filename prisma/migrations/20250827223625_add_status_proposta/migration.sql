-- CreateEnum
CREATE TYPE "public"."StatusProposta" AS ENUM ('PENDENTE', 'ACEITA', 'RECUSADA');

-- AlterTable
ALTER TABLE "public"."Proposta" ADD COLUMN     "status" "public"."StatusProposta" NOT NULL DEFAULT 'PENDENTE';
