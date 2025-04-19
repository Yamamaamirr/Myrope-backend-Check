-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateTable for Geofence
CREATE TABLE "Geofence" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "categories" TEXT[],  -- Array of categories
    "fillColor" TEXT NOT NULL,
    "strokeColor" TEXT NOT NULL,
    "fillOpacity" DOUBLE PRECISION NOT NULL,
    "strokeWidth" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Geofence_pkey" PRIMARY KEY ("id")
);

-- Create unique index for geofence name
CREATE UNIQUE INDEX "Geofence_name_key" ON "Geofence"("name");

-- Add geometry column for storing spatial data
ALTER TABLE "Geofence"
ADD COLUMN "geometry" geometry(MultiPolygon, 4326);

-- Add GIST index on geometry column for fast spatial queries
CREATE INDEX geofence_geom_idx ON "Geofence" USING GIST (geometry);
