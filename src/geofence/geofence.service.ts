import { 
  Injectable, 
  ConflictException, 
  InternalServerErrorException,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { CreateGeofenceDto } from './dto/geofence.dto';
import { GeofenceRepository } from './geofence.repository';
import { 
  convertToMultiPolygon, 
  validateGeoJson, 
  validateCircles, 
  createMultiPointFromCircles 
} from './utils/geojson';
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
}