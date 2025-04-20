import { 
  Injectable, 
  ConflictException, 
  InternalServerErrorException,
  BadRequestException,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { CreateGeofenceDto } from './dto/geofence.dto';
import { GeofenceRepository } from './geofence.repository';
import { 
  convertToMultiPolygon, 
  validateGeoJson, 
  validateCircles, 
  createMultiPointFromCircles 
} from './utils/geojson';
import { UpdateGeofenceDto } from './dto/update-geofence.dto';
import { MultiPolygon, MultiPoint } from 'geojson';

@Injectable()
export class GeofenceService {
  private readonly logger = new Logger(GeofenceService.name);
  
  constructor(private readonly repository: GeofenceRepository) {}

  async createGeofence(dto: CreateGeofenceDto) {
    // 1. Final manual validation (safeguard)
    if (!dto.categories || dto.categories.length === 0) {
      throw new BadRequestException('At least one category is required');
    }

    // 2. Check name uniqueness
    const isNameUnique = await this.repository.isNameUnique(dto.name);
    if (!isNameUnique) {
      throw new ConflictException('Geofence with this name already exists');
    }

    // 3. Prepare data for repository
    let multiPolygon: MultiPolygon | undefined = undefined;
    let circleCenters: MultiPoint | undefined = undefined;
    let circleRadii: number[] | undefined = undefined;

    // Process polygon data if provided
    if (dto.geojson) {
      try {
        validateGeoJson(dto.geojson);
        multiPolygon = convertToMultiPolygon(dto.geojson);
      } catch (error) {
        this.logger.error(`Failed to process GeoJSON: ${error.message}`, error.stack);
        throw new BadRequestException(`Invalid GeoJSON: ${error.message}`);
      }
    }

    // Process circle data if provided
    if (dto.circles && dto.circles.length > 0) {
      try {
        validateCircles(dto.circles);
        circleCenters = createMultiPointFromCircles(dto.circles);
        circleRadii = dto.circles.map(circle => circle.radius);
      } catch (error) {
        this.logger.error(`Failed to process circles: ${error.message}`, error.stack);
        throw new BadRequestException(`Invalid circle data: ${error.message}`);
      }
    }

    // 5. Create geofence
    try {
      await this.repository.createGeofence({
        name: dto.name,
        alertType: dto.alertType,
        categories: dto.categories,
        fillColor: dto.style.fillColor,
        strokeColor: dto.style.strokeColor,
        fillOpacity: dto.style.fillOpacity,
        strokeWidth: dto.style.strokeWidth,
        geometry: multiPolygon,
        circleCenters: circleCenters,
        circleRadii: circleRadii,
      });

      // Return simple success response (original format)
      return { 
        success: true, 
        message: 'Geofence created successfully' 
      };
    } catch (error) {
      this.logger.error(`Failed to create geofence: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to create geofence');
    }
  }

  async updateGeofence(id: string, dto: UpdateGeofenceDto) {
    // 1. Check if geofence exists
    const existingGeofence = await this.repository.findById(id);
    if (!existingGeofence) {
      throw new NotFoundException(`Geofence with ID ${id} not found`);
    }
  
    // 2. If name is being updated, check uniqueness
    if (dto.name && dto.name !== existingGeofence.name) {
      const isNameUnique = await this.repository.isNameUniqueExcept(dto.name, id);
      if (!isNameUnique) {
        throw new ConflictException('Geofence with this name already exists');
      }
    }
  
    // Add style validation
    if (dto.style) {
      if (dto.style.fillOpacity !== undefined && (dto.style.fillOpacity < 0 || dto.style.fillOpacity > 1)) {
        throw new BadRequestException('Fill opacity must be between 0 and 1');
      }
      
      if (dto.style.strokeWidth !== undefined && dto.style.strokeWidth <= 0) {
        throw new BadRequestException('Stroke width must be greater than 0');
      }
    }

    // Add categories validation (same as in createGeofence)
    if (dto.categories && dto.categories.length === 0) {
      throw new BadRequestException('At least one category is required');
    }
  
    // 3. Prepare data for repository
    let multiPolygon: MultiPolygon | null | undefined = undefined;
    let circleCenters: MultiPoint | null | undefined = undefined;
    let circleRadii: number[] | null | undefined = undefined;
  
    // Process polygon data if provided
    if (dto.geojson !== undefined) {
      if (dto.geojson === null) {
        multiPolygon = null;
      } else {
        try {
          validateGeoJson(dto.geojson);
          multiPolygon = convertToMultiPolygon(dto.geojson);
        } catch (error) {
          this.logger.error(`Failed to process GeoJSON: ${error.message}`, error.stack);
          throw new BadRequestException(`Invalid GeoJSON: ${error.message}`);
        }
      }
    }
  
    // Process circle data if provided
    if (dto.circles !== undefined) {
      if (dto.circles === null) {
        circleCenters = null;
        circleRadii = null;
      } else if (dto.circles.length > 0) {
        try {
          validateCircles(dto.circles);
          circleCenters = createMultiPointFromCircles(dto.circles);
          circleRadii = dto.circles.map(circle => circle.radius);
        } catch (error) {
          this.logger.error(`Failed to process circles: ${error.message}`, error.stack);
          throw new BadRequestException(`Invalid circle data: ${error.message}`);
        }
      } else {
        // Empty array case
        circleCenters = null;
        circleRadii = null;
      }
    }
  
    // 4. Update geofence
    try {
      const updateData: any = {};
      
      // Only include fields that are provided in the DTO
      if (dto.name !== undefined) updateData.name = dto.name;
      if (dto.alertType !== undefined) updateData.alertType = dto.alertType;
      if (dto.categories !== undefined) updateData.categories = dto.categories;
      if (dto.style) {
        if (dto.style.fillColor !== undefined) updateData.fillColor = dto.style.fillColor;
        if (dto.style.strokeColor !== undefined) updateData.strokeColor = dto.style.strokeColor;
        if (dto.style.fillOpacity !== undefined) updateData.fillOpacity = dto.style.fillOpacity;
        if (dto.style.strokeWidth !== undefined) updateData.strokeWidth = dto.style.strokeWidth;
      }
      
      // Only update geometry if provided
      if (multiPolygon !== undefined) updateData.geometry = multiPolygon;
      if (circleCenters !== undefined) updateData.circleCenters = circleCenters;
      if (circleRadii !== undefined) updateData.circleRadii = circleRadii;
  
      await this.repository.updateGeofence(id, updateData);
  
      // Return simple success response
      return { 
        success: true, 
        message: 'Geofence updated successfully' 
      };
    } catch (error) {
      this.logger.error(`Failed to update geofence: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to update geofence');
    }
  }

  async deleteGeofence(id: string) {
    // 1. Check if geofence exists
    const existingGeofence = await this.repository.findById(id);
    if (!existingGeofence) {
      throw new NotFoundException(`Geofence with ID ${id} not found`);
    }
  
    // 2. Delete the geofence
    try {
      await this.repository.deleteGeofence(id);
      
      // Return success response
      return { 
        success: true, 
        message: 'Geofence deleted successfully' 
      };
    } catch (error) {
      this.logger.error(`Failed to delete geofence: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to delete geofence');
    }
  }
}