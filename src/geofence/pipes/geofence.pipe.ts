import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { validateGeoJson, validateCircles } from '../utils/geojson';
import { CreateGeofenceDto } from '../dto/geofence.dto';
import { UpdateGeofenceDto } from '../dto/update-geofence.dto';

@Injectable()
export class GeofenceValidationPipe implements PipeTransform {
  transform(value: CreateGeofenceDto | UpdateGeofenceDto): CreateGeofenceDto | UpdateGeofenceDto {
    // Validate name format if provided
    if (value.name) {
      const nameRegex = /^ORG-[a-zA-Z0-9]+-[a-zA-Z0-9]+$/;
      if (!nameRegex.test(value.name)) {
        throw new BadRequestException(
          'Name must be in format ORG-{type}-{location}',
        );
      }
    }

    // For create operations only, ensure at least one geometry type is provided
    if (value instanceof CreateGeofenceDto && !value.geojson && (!value.circles || value.circles.length === 0)) {
      throw new BadRequestException(
        'Either geojson or circles must be provided',
      );
    }

    if (value.style) {

      if (value.style.fillOpacity !== undefined) {
        if (value.style.fillOpacity < 0 || value.style.fillOpacity > 1) {
          throw new BadRequestException(
            'Fill opacity must be between 0 and 1',
          );
        }
      }

      // Check for negative stroke width
      if (value.style.strokeWidth !== undefined) {
        if (value.style.strokeWidth <= 0) {
          throw new BadRequestException(
            'Stroke width must be greater than 0',
          );
        }
      }

      // Validate color formats with proper hex color regex
      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      
      if (value.style.fillColor !== undefined) {
        if (!hexColorRegex.test(value.style.fillColor)) {
          throw new BadRequestException(
            'Fill color must be a valid hex color (e.g., #FF9900 or #F90)',
          );
        }
      }

      if (value.style.strokeColor !== undefined) {
        if (!hexColorRegex.test(value.style.strokeColor)) {
          throw new BadRequestException(
            'Stroke color must be a valid hex color (e.g., #FF9900 or #F90)',
          );
        }
      }
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