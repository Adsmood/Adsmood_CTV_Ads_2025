import { create } from 'xmlbuilder2';
import type { Ad } from '@/lib/supabase/types';

interface VastConfig {
  ad: Ad;
  appUrl: string;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface MediaResolution {
  id: string;
  width: number;
  height: number;
  minBitrate: number;
  maxBitrate: number;
}

function buildResolutions(srcWidth: number, srcHeight: number, srcBitrate: number): MediaResolution[] {
  const targets = [
    { label: 'high', w: 1920, h: 1080, factor: 1.0 },
    { label: 'mid',  w: 1280, h: 720,  factor: 0.5 },
    { label: 'low',  w: 854,  h: 480,  factor: 0.25 },
  ];

  const bitrate = srcBitrate || 4000;
  const results: MediaResolution[] = [];

  for (const t of targets) {
    if (t.w > srcWidth && t.h > srcHeight) continue;
    const br = Math.round(bitrate * t.factor);
    results.push({
      id: `video-${t.label}`,
      width: t.w <= srcWidth ? t.w : srcWidth,
      height: t.h <= srcHeight ? t.h : srcHeight,
      minBitrate: Math.round(br * 0.7),
      maxBitrate: br,
    });
  }

  if (results.length === 0) {
    results.push({
      id: 'video-source',
      width: srcWidth,
      height: srcHeight,
      minBitrate: Math.round(bitrate * 0.7),
      maxBitrate: bitrate,
    });
  }

  return results;
}

function normalizeCodec(codec: string): string {
  if (!codec) return 'avc1.42E01E';
  const lower = codec.toLowerCase();
  if (lower === 'h264' || lower === 'h.264' || lower === 'avc') return 'avc1.42E01E';
  if (lower === 'h265' || lower === 'h.265' || lower === 'hevc') return 'hev1.1.6.L93.B0';
  if (lower === 'vp9') return 'vp09.00.10.08';
  if (lower === 'av1') return 'av01.0.04M.08';
  return codec;
}

interface PlatformMacros {
  impression: string;
  click: string;
  start: string;
  firstQuartile: string;
  midpoint: string;
  thirdQuartile: string;
  complete: string;
  errorCode: string;
}

function getPlatformMacros(platform: string): PlatformMacros {
  switch (platform) {
    case 'thetradedesk':
      return {
        impression: '%%TTD_IMPRESSION%%',
        click: '%%TTD_CLK%%',
        start: '%%TTD_START%%',
        firstQuartile: '%%TTD_FIRST_QUARTILE%%',
        midpoint: '%%TTD_MIDPOINT%%',
        thirdQuartile: '%%TTD_THIRD_QUARTILE%%',
        complete: '%%TTD_COMPLETE%%',
        errorCode: '%%TTD_ERRORCODE%%',
      };
    case 'xandr':
      return {
        impression: '${IMPRESSION_URL}',
        click: '${CLICK_URL}',
        start: '${START}',
        firstQuartile: '${FIRST_QUARTILE}',
        midpoint: '${MIDPOINT}',
        thirdQuartile: '${THIRD_QUARTILE}',
        complete: '${COMPLETE}',
        errorCode: '${ERROR_CODE}',
      };
    case 'amazon':
      return {
        impression: '{{IMPRESSION_URL}}',
        click: '{{CLICK_URL}}',
        start: '{{START}}',
        firstQuartile: '{{FIRST_QUARTILE}}',
        midpoint: '{{MIDPOINT}}',
        thirdQuartile: '{{THIRD_QUARTILE}}',
        complete: '{{COMPLETE}}',
        errorCode: '{{ERROR_CODE}}',
      };
    case 'springserve':
    case 'generic':
      return {
        impression: '',
        click: '',
        start: '',
        firstQuartile: '',
        midpoint: '',
        thirdQuartile: '',
        complete: '',
        errorCode: '[ERRORCODE]',
      };
    default: // dv360
      return {
        impression: '[IMPRESSION_URL]',
        click: '[CLICK_URL_ENC]',
        start: '[START]',
        firstQuartile: '[FIRST_QUARTILE]',
        midpoint: '[MIDPOINT]',
        thirdQuartile: '[THIRD_QUARTILE]',
        complete: '[COMPLETE]',
        errorCode: '[ERRORCODE]',
      };
  }
}

export function generateVastXml(config: VastConfig): string {
  const { ad, appUrl } = config;
  const trackBase = `${appUrl}/api/track/${ad.id}`;
  const platform = ad.platform || 'dv360';
  const macros = getPlatformMacros(platform);

  const doc = create({ version: '1.0', encoding: 'UTF-8' });
  const vast = doc.ele('VAST', { version: ad.vast_version });
  const adEl = vast.ele('Ad', { id: `adsmood-${ad.id}`, sequence: '1' });
  const inLine = adEl.ele('InLine');

  inLine.ele('AdSystem', { version: '2.0' }).txt('Adsmood CTV').up();
  inLine.ele('AdServingId').txt(`adsmood-${ad.id}`).up();
  inLine.ele('AdTitle').txt(ad.name).up();
  inLine.ele('Impression', { id: 'adsmood' }).dat(`${trackBase}?event=impression`).up();
  if (macros.impression) {
    inLine.ele('Impression', { id: platform }).dat(macros.impression).up();
  }
  inLine.ele('Description').txt(`CTV Ad: ${ad.name}`).up();
  inLine.ele('Advertiser').txt('Adsmood').up();
  inLine.ele('Error').dat(`${trackBase}?event=error&code=${macros.errorCode}`).up();

  const viewable = inLine.ele('ViewableImpression', { id: 'adsmood' });
  viewable.ele('Viewable').dat(`${trackBase}?event=viewable`).up();
  viewable.ele('NotViewable').dat(`${trackBase}?event=not_viewable`).up();
  viewable.ele('ViewUndetermined').dat(`${trackBase}?event=view_undetermined`).up();
  viewable.up();

  const extensions = inLine.ele('Extensions');
  const adServing = extensions.ele('Extension', { type: 'AdServingData' });
  adServing.ele('AppBundle').txt('com.adsmood.ctv').up();
  adServing.ele('AdServingVersion').txt('1.0').up();
  adServing.up();
  extensions.up();

  const creatives = inLine.ele('Creatives');

  // Linear creative
  const creative = creatives.ele('Creative', { id: `creative-${ad.id}`, sequence: '1' });
  creative.ele('UniversalAdId', { idRegistry: 'Adsmood' })
    .txt(`adsmood-${ad.id}`).up();

  const linear = creative.ele('Linear');
  if (ad.skip_offset) {
    linear.att('skipoffset', formatDuration(ad.skip_offset));
  }
  linear.ele('Duration').txt(formatDuration(ad.video_duration)).up();

  const tracking = linear.ele('TrackingEvents');
  const trackingEvents = [
    'start', 'firstQuartile', 'midpoint', 'thirdQuartile', 'complete',
    'mute', 'unmute', 'pause', 'resume',
    'playerExpand', 'playerCollapse', 'loaded',
  ];
  if (ad.skip_offset) {
    trackingEvents.push('skip');
  }
  for (const evt of trackingEvents) {
    tracking.ele('Tracking', { event: evt }).dat(`${trackBase}?event=${evt}`).up();
  }
  tracking.ele('Tracking', { event: 'progress', offset: '00:00:05' })
    .dat(`${trackBase}?event=progress`).up();

  // Platform macro tracking
  const macroEvents: [string, string][] = [
    ['start', macros.start],
    ['firstQuartile', macros.firstQuartile],
    ['midpoint', macros.midpoint],
    ['thirdQuartile', macros.thirdQuartile],
    ['complete', macros.complete],
  ];
  for (const [evt, macro] of macroEvents) {
    if (macro) {
      tracking.ele('Tracking', { event: evt }).dat(macro).up();
    }
  }
  tracking.up();

  const clicks = linear.ele('VideoClicks');
  if (ad.click_through_url) {
    clicks.ele('ClickThrough', { id: 'adsmood' }).dat(ad.click_through_url).up();
  }
  clicks.ele('ClickTracking', { id: 'adsmood' }).dat(`${trackBase}?event=click`).up();
  if (macros.click) {
    clicks.ele('ClickTracking', { id: platform }).dat(macros.click).up();
  }
  clicks.up();

  const mediaFiles = linear.ele('MediaFiles');
  const resolutions = buildResolutions(ad.video_width, ad.video_height, ad.video_bitrate);
  const codec = normalizeCodec(ad.video_codec);

  for (const res of resolutions) {
    mediaFiles.ele('MediaFile', {
      id: res.id,
      delivery: 'progressive',
      type: 'video/mp4',
      width: String(res.width),
      height: String(res.height),
      minBitrate: String(res.minBitrate),
      maxBitrate: String(res.maxBitrate),
      codec,
      maintainAspectRatio: 'true',
      scalable: 'true'
    }).dat(ad.video_url).up();
  }
  mediaFiles.ele('Mezzanine', {
    delivery: 'progressive',
    type: 'video/mp4',
    width: String(ad.video_width),
    height: String(ad.video_height),
    codec,
    fileSize: ad.video_bitrate ? String(Math.round(ad.video_bitrate * ad.video_duration / 8 * 1000)) : undefined,
  }).dat(ad.video_url).up();
  mediaFiles.up();
  linear.up();
  creative.up();

  // Companion ad creative
  if (ad.companion_image_url && ad.companion_width && ad.companion_height) {
    const compCreative = creatives.ele('Creative', { id: `companion-${ad.id}`, sequence: '1' });
    const companionAds = compCreative.ele('CompanionAds');
    const companion = companionAds.ele('Companion', {
      id: `companion-banner-${ad.id}`,
      width: String(ad.companion_width),
      height: String(ad.companion_height),
      assetWidth: String(ad.companion_width),
      assetHeight: String(ad.companion_height),
    });
    companion.ele('StaticResource', { creativeType: 'image/png' }).dat(ad.companion_image_url).up();
    if (ad.companion_click_url || ad.click_through_url) {
      companion.ele('CompanionClickThrough').dat(ad.companion_click_url || ad.click_through_url || '').up();
    }
    companion.ele('TrackingEvents')
      .ele('Tracking', { event: 'creativeView' }).dat(`${trackBase}?event=companion_view`).up()
      .up();
    companion.up();
    companionAds.up();
    compCreative.up();
  }

  creatives.up();
  inLine.up();
  adEl.up();
  vast.up();

  return doc.end({ prettyPrint: true });
}

const SPRINGSERVE_MACROS: Record<string, string> = {
  cb: '{{CACHEBUSTER}}',
  ip: '{{IP}}',
  ua: '{{USER_AGENT}}',
  app_bundle: '{{APP_BUNDLE}}',
  app_name: '{{APP_NAME}}',
  app_store_url: '{{APP_STORE_URL}}',
  did: '{{DEVICE_ID}}',
  ifa_type: '{{IFA_TYPE}}',
  device_make: '{{DEVICE_MAKE}}',
  device_model: '{{DEVICE_MODEL}}',
  os: '{{OPERATING_SYSTEM}}',
  osv: '{{OPERATING_SYSTEM_VERSION}}',
  dnt: '{{DNT}}',
  lmt: '{{LMT}}',
  gdpr: '{{GDPR}}',
  gdpr_consent: '{{CONSENT}}',
  us_privacy: '{{US_PRIVACY}}',
};

export function buildSpringServeTagUrl(baseVastUrl: string): string {
  const params = Object.entries(SPRINGSERVE_MACROS)
    .map(([key, macro]) => `${key}=${macro}`)
    .join('&');
  const sep = baseVastUrl.includes('?') ? '&' : '?';
  return `${baseVastUrl}${sep}${params}`;
}
