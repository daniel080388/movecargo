-- CreateTable
CREATE TABLE "StripeProcessedEvent" (
    "id" SERIAL PRIMARY KEY,
    "eventId" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
