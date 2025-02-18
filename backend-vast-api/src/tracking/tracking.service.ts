import { Injectable } from '@nestjs/common';

@Injectable()
export class TrackingService {
  trackImpression(id: string) {
    console.log(`Impression tracked for ad ${id}`);
    return { success: true, event: 'impression', id };
  }

  trackStart(id: string) {
    console.log(`Start tracked for ad ${id}`);
    return { success: true, event: 'start', id };
  }

  trackFirstQuartile(id: string) {
    console.log(`First quartile tracked for ad ${id}`);
    return { success: true, event: 'firstQuartile', id };
  }

  trackMidpoint(id: string) {
    console.log(`Midpoint tracked for ad ${id}`);
    return { success: true, event: 'midpoint', id };
  }

  trackThirdQuartile(id: string) {
    console.log(`Third quartile tracked for ad ${id}`);
    return { success: true, event: 'thirdQuartile', id };
  }

  trackComplete(id: string) {
    console.log(`Complete tracked for ad ${id}`);
    return { success: true, event: 'complete', id };
  }
} 