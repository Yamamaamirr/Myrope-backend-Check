@echo off
echo Starting database migration...

:: Use absolute paths instead of relative paths
cd /d C:\Myropes backend\ms-server-central

:: Run Prisma migration
echo Running Prisma migrations...
npx prisma migrate dev --name init_with_postgis --schema="C:\Myropes backend\ms-server-central\prisma\schema.prisma"

:: Create a temporary SQL file with PostGIS commands
echo Creating PostGIS extension and geometry column...
echo CREATE EXTENSION IF NOT EXISTS postgis; > temp_postgis.sql
echo ALTER TABLE "Geofence" DROP COLUMN IF EXISTS "geometry"; >> temp_postgis.sql
echo ALTER TABLE "Geofence" ADD COLUMN "geometry" geometry(MultiPolygon, 4326); >> temp_postgis.sql
echo CREATE INDEX IF NOT EXISTS geofence_geom_idx ON "Geofence" USING GIST (geometry); >> temp_postgis.sql

:: Extract database connection details from DATABASE_URL in .env file
for /f "tokens=*" %%a in ('type .env ^| findstr DATABASE_URL') do set %%a
echo Using database connection: %DATABASE_URL%

:: Parse the connection string to get credentials
for /f "tokens=1-6 delims=:/ " %%a in ("%DATABASE_URL%") do (
  set DB_USER=%%c
  set DB_PASS=%%d
  set DB_HOST=%%f
  set DB_PORT=%%g
  set DB_NAME=%%h
)

:: Remove any trailing characters from DB_NAME
for /f "tokens=1 delims=?" %%a in ("%DB_NAME%") do set DB_NAME=%%a

echo Connecting to database %DB_NAME% on %DB_HOST%:%DB_PORT% as %DB_USER%

:: Execute the SQL commands
set PGPASSWORD=%DB_PASS%
psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -f temp_postgis.sql

:: Clean up
del temp_postgis.sql

echo Migration completed successfully!