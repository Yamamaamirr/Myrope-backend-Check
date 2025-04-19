import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GeofenceModule } from './geofence/geofence.module';

@Module({
  imports: [GeofenceModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
