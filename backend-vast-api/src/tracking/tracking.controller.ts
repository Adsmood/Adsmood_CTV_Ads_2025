import { Controller, Get, Param } from '@nestjs/common';
import { TrackingService } from './tracking.service';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get('impression/:id')
  trackImpression(@Param('id') id: string) {
    return this.trackingService.trackImpression(id);
  }

  @Get('start/:id')
  trackStart(@Param('id') id: string) {
    return this.trackingService.trackStart(id);
  }

  @Get('firstQuartile/:id')
  trackFirstQuartile(@Param('id') id: string) {
    return this.trackingService.trackFirstQuartile(id);
  }

  @Get('midpoint/:id')
  trackMidpoint(@Param('id') id: string) {
    return this.trackingService.trackMidpoint(id);
  }

  @Get('thirdQuartile/:id')
  trackThirdQuartile(@Param('id') id: string) {
    return this.trackingService.trackThirdQuartile(id);
  }

  @Get('complete/:id')
  trackComplete(@Param('id') id: string) {
    return this.trackingService.trackComplete(id);
  }

  @Get('health')
  health() {
    return { status: 'Tracking service is healthy' };
  }
} 