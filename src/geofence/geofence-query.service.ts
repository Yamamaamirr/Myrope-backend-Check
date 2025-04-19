import { Injectable, NotFoundException } from '@nestjs/common';
import { GeofenceRepository } from './geofence.repository';
import { GeofenceResponseDto, GeofenceListResponseDto } from './dto/get-geofence.dto';

@Injectable()
export class GeofenceQueryService {
  constructor(private readonly repository: GeofenceRepository) {}

  async findAll(): Promise<GeofenceListResponseDto> {
    const records = await this.repository.findAll();
    const total = await this.repository.countAll();

    const geofences = records.map(record => this.mapToResponseDto(record));

    return {
      geofences,
      total,
    };
  }

  async findById(id: string): Promise<GeofenceResponseDto> {
    const record = await this.repository.findById(id);
    
    if (!record) {
      throw new NotFoundException(`Geofence with ID ${id} not found`);
    }

    return this.mapToResponseDto(record);
  }

  private mapToResponseDto(record: any): GeofenceResponseDto {
    const response: GeofenceResponseDto = {
      id: record.id,
      name: record.name,
      alertType: record.alertType,
      categories: record.categories,
      fillColor: record.fillColor,
      strokeColor: record.strokeColor,
      fillOpacity: record.fillOpacity,
      strokeWidth: record.strokeWidth,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };

    // Add polygon geometry if exists
    if (record.geometry) {
      response.geometry = record.geometry;
    }

    // Add circles if they exist
    if (record.circle_centers && record.circle_radii) {
      const centers = record.circle_centers.coordinates || [];
      const radii = record.circle_radii || [];
      
      if (centers.length === radii.length) {
        response.circles = centers.map((center, index) => ({
          center: center,
          radius: radii[index]
        }));
      }
    }

    return response;
  }
}