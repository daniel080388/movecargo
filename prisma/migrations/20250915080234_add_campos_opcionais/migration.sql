-- AlterTable
ALTER TABLE "public"."Carga" ADD COLUMN     "altura" DOUBLE PRECISION,
ADD COLUMN     "comprimento" DOUBLE PRECISION,
ADD COLUMN     "dataFim" TIMESTAMP(3),
ADD COLUMN     "dataInicio" TIMESTAMP(3),
ADD COLUMN     "expresso" BOOLEAN,
ADD COLUMN     "largura" DOUBLE PRECISION,
ADD COLUMN     "meiaCarga" BOOLEAN,
ADD COLUMN     "multiDestino" BOOLEAN,
ADD COLUMN     "tipoCaminhao" TEXT,
ADD COLUMN     "volume" TEXT;
