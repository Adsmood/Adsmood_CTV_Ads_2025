import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST') || 'localhost',
        port: parseInt(configService.get<string>('DATABASE_PORT') || '5432', 10),
        username: configService.get<string>('DATABASE_USERNAME') || 'postgres',
        password: configService.get<string>('DATABASE_PASSWORD') || '',
        database: configService.get<string>('DATABASE_NAME') || 'adsmood_ctv_db',
        autoLoadEntities: true,
        synchronize: true
      }),
      inject: [ConfigService]
    })
  ]
})
export class DatabaseModule {} 