/*
  Warnings:

  - Made the column `mensagem` on table `Proposta` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Proposta" ALTER COLUMN "mensagem" SET NOT NULL;
