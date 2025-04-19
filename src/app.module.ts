import { Module } from '@nestjs/common';
import { GeofenceModule } from './geofence/geofence.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [GeofenceModule],
  providers: [PrismaService],
})
export class AppModule {}