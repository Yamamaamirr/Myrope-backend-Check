import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreateGeofenceDto } from './geofence.dto';
import { PartialType, OmitType } from '@nestjs/swagger';

export class UpdateGeofenceDto extends PartialType(
  OmitType(CreateGeofenceDto, ['name'] as const),
) {
  // Name is optional for updates but must follow the same pattern if provided
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}