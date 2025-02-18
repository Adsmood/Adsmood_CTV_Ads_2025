import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('DATABASE_HOST');
        const port = configService.get<string>('DATABASE_PORT');
        const username = configService.get<string>('DATABASE_USERNAME');
        const password = configService.get<string>('DATABASE_PASSWORD');
        const database = configService.get<string>('DATABASE_NAME');

        if (!host || !port || !username || !password || !database) {
          throw new Error('Database configuration is missing. Please check environment variables.');
        }

        return {
          type: 'postgres',
          host,
          port: parseInt(port, 10),
          username,
          password,
          database,
          autoLoadEntities: true,
          synchronize: true,
          ssl: {
            rejectUnauthorized: false
          }
        };
      },
      inject: [ConfigService]
    })
  ]
})
export class DatabaseModule {} 