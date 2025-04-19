import { ApiProperty } from '@nestjs/swagger';
import { MultiPolygon, MultiPoint } from 'geojson';

export class CircleResponseDto {
  @ApiProperty()
  center: [number, number];

  @ApiProperty()
  radius: number;
}

export class GeofenceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  alertType: string;

  @ApiProperty({ type: [String] })
  categories: string[];

  @ApiProperty()
  fillColor: string;

  @ApiProperty()
  strokeColor: string;

  @ApiProperty()
  fillOpacity: number;

  @ApiProperty()
  strokeWidth: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  geometry?: MultiPolygon;

  @ApiProperty({ type: [CircleResponseDto], required: false })
  circles?: CircleResponseDto[];
}

export class GeofenceListResponseDto {
  @ApiProperty({ type: [GeofenceResponseDto] })
  geofences: GeofenceResponseDto[];

  @ApiProperty()
  total: number;
}