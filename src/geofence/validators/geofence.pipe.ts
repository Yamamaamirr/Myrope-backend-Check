import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { validateGeoJson, validateCircles } from '../utils/geojson';
import { CreateGeofenceDto } from '../dto/geofence.dto';

@Injectable()
export class GeofenceValidationPipe implements PipeTransform {
  transform(value: CreateGeofenceDto): CreateGeofenceDto {
    const nameRegex = /^ORG-[a-zA-Z0-9]+-[a-zA-Z0-9]+$/;
    if (!nameRegex.test(value.name)) {
      throw new BadRequestException(
        'Name must be in format ORG-{type}-{location}',
      );
    }

    // Ensure at least one geometry type is provided
    if (!value.geojson && (!value.circles || value.circles.length === 0)) {
      throw new BadRequestException(
        'Either geojson or circles must be provided',
      );
    }

    // Validate geojson if provided
    if (value.geojson) {
      try {
        validateGeoJson(value.geojson);
      } catch (error) {
        throw new BadRequestException(error.message);
      }
    }

    // Validate circles if provided
    if (value.circles && value.circles.length > 0) {
      try {
        validateCircles(value.circles);
      } catch (error) {
        throw new BadRequestException(error.message);
      }
    }

    return value;
  }
}