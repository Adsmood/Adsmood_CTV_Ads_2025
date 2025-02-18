import { Injectable } from '@nestjs/common';
import { create } from 'xmlbuilder2';

@Injectable()
export class VastService {
  generateVastXml(): string {
    const vastObj = {
      VAST: {
        '@version': '4.1',
        Ad: {
          InLine: {
            AdSystem: 'Adsmood CTV',
            AdTitle: 'CTV Interactive Ad',
            Impression: { '#': 'https://adsmood-ctv-tracking.onrender.com/impression' },
            Creatives: {
              Creative: {
                Linear: {
                  Duration: '00:00:30',
                  MediaFiles: {
                    MediaFile: [
                      {
                        '@delivery': 'progressive',
                        '@type': 'video/mp4',
                        '@width': '1920',
                        '@height': '1080',
                        '#': 'https://assets.example.com/video.mp4'
                      }
                    ]
                  },
                  TrackingEvents: {
                    Tracking: [
                      { '@event': 'start', '#': 'https://adsmood-ctv-tracking.onrender.com/start' },
                      { '@event': 'firstQuartile', '#': 'https://adsmood-ctv-tracking.onrender.com/firstQuartile' },
                      { '@event': 'midpoint', '#': 'https://adsmood-ctv-tracking.onrender.com/midpoint' },
                      { '@event': 'thirdQuartile', '#': 'https://adsmood-ctv-tracking.onrender.com/thirdQuartile' },
                      { '@event': 'complete', '#': 'https://adsmood-ctv-tracking.onrender.com/complete' }
                    ]
                  }
                }
              }
            },
            Extensions: {
              Extension: [
                {
                  Name: 'QRCode',
                  Url: 'https://api.qrserver.com/v1/create-qr-code/?data=[CACHEBUSTING]&ts=[TIMESTAMP]'
                }
              ]
            }
          }
        }
      }
    };

    let xmlStr = create(vastObj).end({ prettyPrint: true });
    xmlStr = xmlStr.replace(/\[CACHEBUSTING\]/g, Math.floor(Math.random() * 1000000).toString());
    xmlStr = xmlStr.replace(/\[TIMESTAMP\]/g, Date.now().toString());
    return xmlStr;
  }
} 