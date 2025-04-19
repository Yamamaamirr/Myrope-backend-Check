import { Module } from '@nestjs/common';
import { GeofenceController } from './geofence.controller';
import { GeofenceService } from './geofence.service';
import { GeofenceRepository } from './geofence.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { GeofenceQueryService } from './geofence-query.service';

@Module({
  controllers: [GeofenceController],
  providers: [
    GeofenceService,
    GeofenceQueryService, // Add this line
    GeofenceRepository,
    PrismaService
  ],
})
export class GeofenceModule {}