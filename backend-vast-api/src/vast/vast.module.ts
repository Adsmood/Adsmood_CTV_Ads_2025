import { Module } from '@nestjs/common';
import { VastController } from './vast.controller';
import { VastService } from './vast.service';

@Module({
  controllers: [VastController],
  providers: [VastService]
})
export class VastModule {} 