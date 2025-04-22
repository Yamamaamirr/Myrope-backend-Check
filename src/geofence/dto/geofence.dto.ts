import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { GeoJsonProperties } from 'geojson';

class StyleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fillColor: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  strokeColor: string;

  @ApiProperty()
  @IsNumber()
  fillOpacity: number;

  @ApiProperty()
  @IsNumber()
  strokeWidth: number;
}

class CircleDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  radius: number;

  @ApiProperty()
  @IsArray()
  @IsNumber({}, { each: true })
  center: [number, number]; 
}

class GeometryDto {
  @ApiProperty()
  @IsString()
  @IsIn(['Polygon', 'MultiPolygon'])
  type: 'Polygon' | 'MultiPolygon';

  @ApiProperty()
  @IsArray()
  coordinates: number[][][] | number[][][][];
}

class FeatureDto {
  @ApiProperty()
  @IsString()
  @IsIn(['Feature'])
  type: 'Feature';

  @ApiProperty({ type: Object })
  @IsObject()
  properties: GeoJsonProperties;

  @ApiProperty()
  @ValidateNested()
  @Type(() => GeometryDto)
  geometry: GeometryDto;
}

class GeoJsonDto {
  @ApiProperty()
  @IsString()
  @IsIn(['FeatureCollection'])
  type: 'FeatureCollection';

  @ApiProperty({ type: [FeatureDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureDto)
  features: FeatureDto[];
}

export class CreateGeofenceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsIn(['Enter', 'Exit', 'Both'])
  alertType: 'Enter' | 'Exit' | 'Both';

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  categories: string[];

  @ApiProperty()
  @ValidateNested()
  @Type(() => StyleDto)
  style: StyleDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => GeoJsonDto)
  geojson?: GeoJsonDto;

  @ApiProperty({ required: false, type: [CircleDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CircleDto)
  circles?: CircleDto[];
}