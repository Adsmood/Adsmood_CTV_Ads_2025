import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database.module';
import { ProjectModule } from './project/project.module';
import { VastModule } from './vast/vast.module';
import { TrackingModule } from './tracking/tracking.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    DatabaseModule,
    ProjectModule,
    VastModule,
    TrackingModule
  ]
})
export class AppModule {} 