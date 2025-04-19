import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MultiPolygon, MultiPoint } from 'geojson';


interface GeofenceRecord {
  id: string;
  name: string;
  alertType: string;
  categories: string[];
  fillColor: string;
  strokeColor: string;
  fillOpacity: number;
  strokeWidth: number;
  createdAt: Date;
  updatedAt: Date;
  geometry: MultiPolygon | null;
  circle_centers: MultiPoint | null;
  circle_radii: number[] | null;
}

interface CountResult {
  count: bigint;
}

@Injectable()
export class GeofenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Updated create method to handle both polygons and circles
  async createGeofence(data: {
    name: string;
    alertType: string;
    categories: string[];
    fillColor: string;
    strokeColor: string;
    fillOpacity: number;
    strokeWidth: number;
    geometry?: MultiPolygon;
    circleCenters?: MultiPoint;
    circleRadii?: number[];
  }) {
    // Convert geometry objects to JSON strings if they exist
    const geometryJson = data.geometry ? JSON.stringify(data.geometry) : null;
    const circleCentersJson = data.circleCenters ? JSON.stringify(data.circleCenters) : null;
    
    // Build the SQL query dynamically based on what data is provided
    let query = `
      INSERT INTO "Geofence" (
        "id",
        "name",
        "alertType",
        "categories",
        "fillColor",
        "strokeColor",
        "fillOpacity",
        "strokeWidth",
        "updatedAt"
    `;
    
    // Add geometry columns conditionally
    if (geometryJson) {
      query += `, "geometry"`;
    }
    
    if (circleCentersJson) {
      query += `, "circle_centers", "circle_radii"`;
    }
    
    query += `) VALUES (
      gen_random_uuid(),
      $1, $2, $3, $4, $5, $6, $7,
      NOW()
    `;
    
    // Add values placeholders conditionally
    const params = [
      data.name,
      data.alertType,
      data.categories,
      data.fillColor,
      data.strokeColor,
      data.fillOpacity,
      data.strokeWidth,
    ];
    
    let paramIndex = 8;
    
    if (geometryJson) {
      query += `, ST_SetSRID(ST_GeomFromGeoJSON($${paramIndex}), 4326)`;
      params.push(geometryJson);
      paramIndex++;
    }
    
    if (circleCentersJson) {
      // Use ARRAY constructor with individual elements
      const radiiPlaceholders = data.circleRadii?.map((_, i) => `$${paramIndex + 1 + i}`).join(',') || '';
      query += `, ST_SetSRID(ST_GeomFromGeoJSON($${paramIndex}), 4326), ARRAY[${radiiPlaceholders}]::float[]`;
      
      params.push(circleCentersJson);
      
      // Add each radius as a separate parameter
      if (data.circleRadii && data.circleRadii.length > 0) {
        data.circleRadii.forEach(radius => {
          params.push(radius);
        });
      }
      
      paramIndex += 1 + (data.circleRadii?.length || 0);
    }
    
    query += `)`;
    
    return this.prisma.$executeRawUnsafe(query, ...params);
  }

  // Update findAll to include circle data
  async findAll(): Promise<GeofenceRecord[]> {
    const result = await this.prisma.$queryRawUnsafe<GeofenceRecord[]>(`
      SELECT 
        "id",
        "name",
        "alertType",
        "categories",
        "fillColor",
        "strokeColor",
        "fillOpacity",
        "strokeWidth",
        "createdAt",
        "updatedAt",
        ST_AsGeoJSON("geometry")::json AS geometry,
        ST_AsGeoJSON("circle_centers")::json AS circle_centers,
        "circle_radii"
      FROM "Geofence"
      ORDER BY "createdAt" DESC
    `);
    return result;
  }

  // Update findById to include circle data
  async findById(id: string): Promise<GeofenceRecord | null> {
    const result = await this.prisma.$queryRawUnsafe<GeofenceRecord[]>(
      `
      SELECT 
        "id",
        "name",
        "alertType",
        "categories",
        "fillColor",
        "strokeColor",
        "fillOpacity",
        "strokeWidth",
        "createdAt",
        "updatedAt",
        ST_AsGeoJSON("geometry")::json AS geometry,
        ST_AsGeoJSON("circle_centers")::json AS circle_centers,
        "circle_radii"
      FROM "Geofence"
      WHERE "id" = $1
      LIMIT 1
    `,
      id,
    );
    return result[0] || null;
  }

  // Existing methods remain unchanged
  async countAll(): Promise<number> {
    const result = await this.prisma.$queryRawUnsafe<CountResult[]>(
      `SELECT COUNT(*)::bigint as count FROM "Geofence"`
    );
    return Number(result[0].count);
  }

  async isNameUnique(name: string): Promise<boolean> {
    const count = await this.prisma.geofence.count({
      where: { name },
    });
    return count === 0;
  }
}