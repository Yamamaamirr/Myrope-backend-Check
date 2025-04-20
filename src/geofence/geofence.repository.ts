import { Injectable, NotFoundException } from '@nestjs/common';
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
  async updateGeofence(
    id: string,
    data: {
      name?: string;
      alertType?: string;
      categories?: string[];
      fillColor?: string;
      strokeColor?: string;
      fillOpacity?: number;
      strokeWidth?: number;
      geometry?: MultiPolygon | null;
      circleCenters?: MultiPoint | null;
      circleRadii?: number[] | null;
    }
  ) {
    // Start building the query
    let query = `UPDATE "Geofence" SET "updatedAt" = NOW()`;
    const params: any[] = [];
    let paramIndex = 1;
  
    // Add fields that are being updated
    if (data.name !== undefined) {
      query += `, "name" = $${paramIndex}`;
      params.push(data.name);
      paramIndex++;
    }
  
    if (data.alertType !== undefined) {
      query += `, "alertType" = $${paramIndex}`;
      params.push(data.alertType);
      paramIndex++;
    }
  
    if (data.categories !== undefined) {
      query += `, "categories" = $${paramIndex}`;
      params.push(data.categories);
      paramIndex++;
    }
  
    if (data.fillColor !== undefined) {
      query += `, "fillColor" = $${paramIndex}`;
      params.push(data.fillColor);
      paramIndex++;
    }
  
    if (data.strokeColor !== undefined) {
      query += `, "strokeColor" = $${paramIndex}`;
      params.push(data.strokeColor);
      paramIndex++;
    }
  
    if (data.fillOpacity !== undefined) {
      query += `, "fillOpacity" = $${paramIndex}`;
      params.push(data.fillOpacity);
      paramIndex++;
    }
  
    if (data.strokeWidth !== undefined) {
      query += `, "strokeWidth" = $${paramIndex}`;
      params.push(data.strokeWidth);
      paramIndex++;
    }
  
    // Handle geometry updates, including null case
    if (data.geometry !== undefined) {
      if (data.geometry === null) {
        query += `, "geometry" = NULL`;
      } else {
        const geometryJson = JSON.stringify(data.geometry);
        query += `, "geometry" = ST_SetSRID(ST_GeomFromGeoJSON($${paramIndex}), 4326)`;
        params.push(geometryJson);
        paramIndex++;
      }
    }
  
    // Handle circle updates, including null case
    if (data.circleCenters !== undefined) {
      if (data.circleCenters === null) {
        query += `, "circle_centers" = NULL`;
      } else {
        const circleCentersJson = JSON.stringify(data.circleCenters);
        query += `, "circle_centers" = ST_SetSRID(ST_GeomFromGeoJSON($${paramIndex}), 4326)`;
        params.push(circleCentersJson);
        paramIndex++;
      }
    }
  
    if (data.circleRadii !== undefined) {
      if (data.circleRadii === null) {
        query += `, "circle_radii" = NULL`;
      } else {
        // Create placeholders for each radius
        const radiiPlaceholders = data.circleRadii.map((_, i) => `$${paramIndex + i}`).join(',');
        query += `, "circle_radii" = ARRAY[${radiiPlaceholders}]::float[]`;
        
        // Add each radius as a separate parameter
        data.circleRadii.forEach(radius => {
          params.push(radius);
        });
        
        paramIndex += data.circleRadii.length;
      }
    }
  
    // Add WHERE clause - but don't return the geometry directly
    query += ` WHERE "id" = $${paramIndex}`;
    params.push(id);
  
    // Execute the update query without returning geometry
    await this.prisma.$executeRawUnsafe(query, ...params);
    
    // Then fetch the updated record using our existing findById method
    // which already handles geometry serialization correctly
    return this.findById(id);
  }
  async isNameUniqueExcept(name: string, id: string): Promise<boolean> {
    const count = await this.prisma.geofence.count({
      where: {
        name,
        id: {
          not: id
        }
      },
    });
    return count === 0;
  }

  async deleteGeofence(id: string): Promise<void> {
    try {
      await this.prisma.geofence.delete({
        where: { id }
      });
    } catch (error) {
      if (error.code === 'P2025') {
        // Prisma error code for record not found
        throw new NotFoundException(`Geofence with ID ${id} not found`);
      }
      throw error;
    }
  }
}