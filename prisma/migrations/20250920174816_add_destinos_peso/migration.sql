/*
  Warnings:

  - You are about to drop the column `destino` on the `Carga` table. All the data in the column will be lost.
  - You are about to drop the column `peso` on the `Carga` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Carga" DROP COLUMN "destino",
DROP COLUMN "peso",
ADD COLUMN     "pesoKg" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."Proposta" ADD COLUMN     "contactsReleased" BOOLEAN DEFAULT false;

-- CreateTable
CREATE TABLE "public"."Destino" (
    "id" SERIAL NOT NULL,
    "cidade" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "ordem" INTEGER NOT NULL,
    "cargaId" INTEGER NOT NULL,

    CONSTRAINT "Destino_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Avaliacao" (
    "id" SERIAL NOT NULL,
    "fromUserId" INTEGER NOT NULL,
    "toUserId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Avaliacao_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Destino" ADD CONSTRAINT "Destino_cargaId_fkey" FOREIGN KEY ("cargaId") REFERENCES "public"."Carga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Avaliacao" ADD CONSTRAINT "Avaliacao_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Avaliacao" ADD CONSTRAINT "Avaliacao_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
