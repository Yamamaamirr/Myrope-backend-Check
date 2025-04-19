-- CreateTable
CREATE TABLE "Geofence" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "categories" TEXT[],
    "fillColor" TEXT NOT NULL,
    "strokeColor" TEXT NOT NULL,
    "fillOpacity" DOUBLE PRECISION NOT NULL,
    "strokeWidth" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Geofence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Geofence_name_key" ON "Geofence"("name");

-- CreateIndex
CREATE INDEX "Geofence_name_idx" ON "Geofence"("name");
