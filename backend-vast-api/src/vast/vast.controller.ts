import { Controller, Get } from '@nestjs/common';
import { VastService } from './vast.service';

@Controller('vast')
export class VastController {
  constructor(private readonly vastService: VastService) {}

  @Get('generate')
  generateVast() {
    const xml = this.vastService.generateVastXml();
    return xml;
  }
} 