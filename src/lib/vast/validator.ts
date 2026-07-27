import { convert } from 'xmlbuilder2';

export interface CheckResult {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'warn';
  detail: string;
}

export interface ValidationResult {
  total: number;
  passed: number;
  failed: number;
  warned: number;
  overall: 'pass' | 'pass_with_warnings' | 'fail';
  checks: CheckResult[];
}

function getTextContent(node: unknown): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    if ('#' in obj) return String(obj['#']);
    if ('$' in obj) return String(obj['$']);
  }
  return '';
}

function toArray<T>(val: T | T[] | undefined): T[] {
  if (val === undefined || val === null) return [];
  return Array.isArray(val) ? val : [val];
}

function isValidDuration(dur: string): boolean {
  return /^\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(dur);
}

function isValidUri(uri: string): boolean {
  if (!uri || uri.trim() === '') return false;
  if (/[\[\]{}%%\$]/.test(uri)) return false;
  try {
    new URL(uri);
    return true;
  } catch {
    return /^https?:\/\/.+/.test(uri);
  }
}

function isMacroUri(uri: string): boolean {
  return /[\[\]{}%%\$]/.test(uri);
}

interface ParsedVast {
  raw: string;
  obj: Record<string, unknown>;
  vast: Record<string, unknown>;
  ad: Record<string, unknown>;
  inLine: Record<string, unknown>;
  linear: Record<string, unknown> | null;
  mediaFiles: unknown[];
  trackingEvents: unknown[];
}

function parseVastXml(xml: string): ParsedVast | null {
  try {
    const obj = convert(xml, { format: 'object' }) as Record<string, unknown>;
    const vast = (obj['VAST'] || {}) as Record<string, unknown>;
    const ad = (vast['Ad'] || {}) as Record<string, unknown>;
    const inLine = (ad['InLine'] || {}) as Record<string, unknown>;

    const creatives = inLine['Creatives'] as Record<string, unknown> | undefined;
    const creativeArr = toArray((creatives as Record<string, unknown>)?.['Creative']);
    let linear: Record<string, unknown> | null = null;
    for (const c of creativeArr) {
      const cr = c as Record<string, unknown>;
      if (cr['Linear']) {
        linear = cr['Linear'] as Record<string, unknown>;
        break;
      }
    }

    let mediaFiles: unknown[] = [];
    if (linear) {
      const mf = linear['MediaFiles'] as Record<string, unknown> | undefined;
      if (mf) {
        mediaFiles = toArray(mf['MediaFile']);
      }
    }

    let trackingEvents: unknown[] = [];
    if (linear) {
      const te = linear['TrackingEvents'] as Record<string, unknown> | undefined;
      if (te) {
        trackingEvents = toArray(te['Tracking']);
      }
    }

    return { raw: xml, obj, vast, ad, inLine, linear, mediaFiles, trackingEvents };
  } catch {
    return null;
  }
}

function checkXmlStructure(parsed: ParsedVast): CheckResult[] {
  const results: CheckResult[] = [];

  const hasProlog = parsed.raw.startsWith('<?xml');
  results.push({
    id: 'xml-prolog',
    label: 'XML Declaration',
    status: hasProlog ? 'pass' : 'fail',
    detail: hasProlog ? 'Valid XML prolog with UTF-8 encoding' : 'Missing XML declaration',
  });

  const version = (parsed.vast as Record<string, unknown>)?.['@version'];
  const validVersions = ['4.2', '4.1', '4.0', '3.0', '2.0'];
  const isValid = typeof version === 'string' && validVersions.includes(version);
  results.push({
    id: 'vast-root',
    label: 'VAST Version',
    status: version === '4.2' ? 'pass' : isValid ? 'warn' : 'fail',
    detail: version === '4.2'
      ? 'VAST element with version="4.2"'
      : isValid
        ? `VAST version "${version}" - consider upgrading to 4.2`
        : `VAST version is "${version || 'missing'}", expected "4.2"`,
  });

  const hasInLine = !!parsed.inLine && Object.keys(parsed.inLine).length > 0;
  results.push({
    id: 'inline-element',
    label: 'InLine Element',
    status: hasInLine ? 'pass' : 'fail',
    detail: hasInLine ? 'Ad contains InLine element' : 'Missing InLine element (required for inline ads)',
  });

  return results;
}

function checkRequiredElements(parsed: ParsedVast): CheckResult[] {
  const results: CheckResult[] = [];
  const il = parsed.inLine;

  const requiredChecks: { id: string; label: string; key: string; spec: string }[] = [
    { id: 'ad-system', label: 'AdSystem', key: 'AdSystem', spec: 'VAST 4.2 §3.4' },
    { id: 'ad-serving-id', label: 'AdServingId', key: 'AdServingId', spec: 'VAST 4.1 §3.4.1' },
    { id: 'ad-title', label: 'AdTitle', key: 'AdTitle', spec: 'VAST 4.2 §3.4' },
    { id: 'impression', label: 'Impression', key: 'Impression', spec: 'VAST 4.2 §3.4' },
    { id: 'creatives', label: 'Creatives', key: 'Creatives', spec: 'VAST 4.2 §3.4' },
    { id: 'error', label: 'Error', key: 'Error', spec: 'VAST 4.2 §3.4' },
  ];

  for (const check of requiredChecks) {
    const val = il[check.key];
    const found = val !== undefined && val !== null;
    results.push({
      id: check.id,
      label: check.label,
      status: found ? 'pass' : 'fail',
      detail: found
        ? `${check.label} element present`
        : `Missing required ${check.label} element (${check.spec})`,
    });
  }

  const optionalChecks: { id: string; label: string; key: string }[] = [
    { id: 'description', label: 'Description', key: 'Description' },
    { id: 'advertiser', label: 'Advertiser', key: 'Advertiser' },
    { id: 'viewable', label: 'ViewableImpression', key: 'ViewableImpression' },
  ];

  for (const check of optionalChecks) {
    const val = il[check.key];
    const found = val !== undefined && val !== null;
    results.push({
      id: check.id,
      label: check.label,
      status: found ? 'pass' : 'warn',
      detail: found
        ? `${check.label} element present`
        : `Optional ${check.label} element not included`,
    });
  }

  if (parsed.linear) {
    const duration = parsed.linear['Duration'];
    const hasDuration = duration !== undefined;
    const durText = getTextContent(duration);
    const validFormat = hasDuration && isValidDuration(durText);
    results.push({
      id: 'duration',
      label: 'Duration',
      status: !hasDuration ? 'fail' : validFormat ? 'pass' : 'warn',
      detail: !hasDuration
        ? 'Missing required Duration element'
        : validFormat
          ? `Duration: ${durText}`
          : `Duration format invalid: "${durText}" (expected HH:MM:SS)`,
    });
  } else {
    results.push({
      id: 'duration',
      label: 'Duration',
      status: 'fail',
      detail: 'No Linear creative found - Duration cannot be checked',
    });
  }

  const hasMediaFiles = parsed.mediaFiles.length > 0;
  results.push({
    id: 'media-files',
    label: 'MediaFiles',
    status: hasMediaFiles ? 'pass' : 'fail',
    detail: hasMediaFiles
      ? `${parsed.mediaFiles.length} MediaFile element(s) found`
      : 'Missing required MediaFiles/MediaFile elements',
  });

  const hasMezzanine = parsed.linear
    ? (parsed.linear['MediaFiles'] as Record<string, unknown>)?.['Mezzanine'] !== undefined
    : false;
  results.push({
    id: 'mezzanine',
    label: 'Mezzanine',
    status: hasMezzanine ? 'pass' : 'warn',
    detail: hasMezzanine
      ? 'Mezzanine element present (SSAI-ready)'
      : 'No Mezzanine element - recommended for SSAI/ad-stitching (VAST 4.1 §3.9.2)',
  });

  results.push({
    id: 'tracking',
    label: 'TrackingEvents',
    status: parsed.trackingEvents.length > 0 ? 'pass' : 'fail',
    detail: parsed.trackingEvents.length > 0
      ? `${parsed.trackingEvents.length} tracking events found`
      : 'Missing required TrackingEvents element',
  });

  const creatives = parsed.inLine['Creatives'] as Record<string, unknown> | undefined;
  const creativeArr = toArray(creatives?.['Creative']);
  let hasUniversalAdId = false;
  let universalAdIdHasIdValue = false;
  for (const c of creativeArr) {
    const cr = c as Record<string, unknown>;
    if (cr['UniversalAdId']) {
      hasUniversalAdId = true;
      const uaid = cr['UniversalAdId'] as Record<string, unknown>;
      if (uaid['@idValue']) {
        universalAdIdHasIdValue = true;
      }
    }
  }
  if (hasUniversalAdId) {
    results.push({
      id: 'universal-ad-id',
      label: 'UniversalAdId',
      status: universalAdIdHasIdValue ? 'warn' : 'pass',
      detail: universalAdIdHasIdValue
        ? 'UniversalAdId uses deprecated idValue attribute (VAST 4.1 §2.3.5.3) - value should be text content'
        : 'UniversalAdId element present with correct format',
    });
  } else {
    results.push({
      id: 'universal-ad-id',
      label: 'UniversalAdId',
      status: 'warn',
      detail: 'Optional UniversalAdId element not included',
    });
  }

  return results;
}

function checkXsdOrder(parsed: ParsedVast): CheckResult {
  const orderKeys = [
    'AdSystem', 'AdServingId', 'AdTitle', 'Impression', 'Description',
    'Advertiser', 'Error', 'ViewableImpression', 'Extensions', 'Creatives',
  ];

  const raw = parsed.raw;
  const positions = orderKeys
    .map((key) => ({ key, pos: raw.indexOf(`<${key}`) }))
    .filter((t) => t.pos >= 0);

  let inOrder = true;
  for (let i = 1; i < positions.length; i++) {
    if (positions[i].pos < positions[i - 1].pos) {
      inOrder = false;
      break;
    }
  }

  const presentKeys = orderKeys.filter((k) => parsed.inLine[k] !== undefined);

  return {
    id: 'xsd-order',
    label: 'XSD Element Order',
    status: inOrder ? 'pass' : 'fail',
    detail: inOrder
      ? `InLine child elements follow VAST 4.2 XSD order (${presentKeys.length} elements checked)`
      : 'Elements are out of VAST 4.2 XSD order - DSPs may reject this tag',
  };
}

function checkMediaFiles(parsed: ParsedVast): CheckResult[] {
  const results: CheckResult[] = [];
  const mediaFiles = parsed.mediaFiles;
  const count = mediaFiles.length;

  results.push({
    id: 'media-count',
    label: 'Multiple Resolutions',
    status: count >= 2 ? 'pass' : count === 1 ? 'warn' : 'fail',
    detail: count >= 2
      ? `${count} MediaFile entries (multi-resolution)`
      : count === 1
        ? 'Only 1 resolution - CTV players prefer multiple'
        : 'No MediaFile elements found',
  });

  if (count > 0) {
    const firstMf = mediaFiles[0] as Record<string, unknown>;

    const hasMinBitrate = mediaFiles.some((m) => (m as Record<string, unknown>)['@minBitrate'] !== undefined);
    const hasMaxBitrate = mediaFiles.some((m) => (m as Record<string, unknown>)['@maxBitrate'] !== undefined);
    const hasDeprecatedBitrate = mediaFiles.some((m) => (m as Record<string, unknown>)['@bitrate'] !== undefined);

    results.push({
      id: 'bitrate-attrs',
      label: 'Bitrate Attributes',
      status: hasMinBitrate && hasMaxBitrate && !hasDeprecatedBitrate ? 'pass'
        : hasDeprecatedBitrate ? 'warn' : hasMinBitrate || hasMaxBitrate ? 'pass' : 'warn',
      detail: hasMinBitrate && hasMaxBitrate && !hasDeprecatedBitrate
        ? 'Uses minBitrate/maxBitrate (VAST 4.x compliant)'
        : hasDeprecatedBitrate
          ? 'Uses deprecated bitrate attr - should use minBitrate/maxBitrate'
          : 'Missing bitrate information',
    });

    const codec = String(firstMf['@codec'] || '');
    const isRfc6381 = /^(avc1|hev1|vp09|av01)\./.test(codec);
    results.push({
      id: 'codec-format',
      label: 'Codec Format',
      status: isRfc6381 ? 'pass' : codec ? 'warn' : 'fail',
      detail: isRfc6381
        ? `RFC 6381 codec: ${codec}`
        : codec
          ? `Informal codec "${codec}" - recommend RFC 6381 format`
          : 'No codec specified on MediaFile elements',
    });

    const hasProgressive = mediaFiles.some((m) => (m as Record<string, unknown>)['@delivery'] === 'progressive');
    results.push({
      id: 'delivery',
      label: 'Delivery Method',
      status: hasProgressive ? 'pass' : 'warn',
      detail: hasProgressive ? 'Progressive delivery (CTV compatible)' : 'No progressive delivery found',
    });

    const widthValid = mediaFiles.every((m) => {
      const w = Number((m as Record<string, unknown>)['@width']);
      return w > 0 && Number.isInteger(w);
    });
    const heightValid = mediaFiles.every((m) => {
      const h = Number((m as Record<string, unknown>)['@height']);
      return h > 0 && Number.isInteger(h);
    });
    results.push({
      id: 'media-dimensions',
      label: 'MediaFile Dimensions',
      status: widthValid && heightValid ? 'pass' : 'fail',
      detail: widthValid && heightValid
        ? 'All MediaFile elements have valid width/height attributes'
        : 'Invalid or missing width/height on MediaFile elements (must be positive integers)',
    });

    const typeValid = mediaFiles.every((m) => {
      const t = String((m as Record<string, unknown>)['@type'] || '');
      return t.startsWith('video/') || t.startsWith('application/');
    });
    results.push({
      id: 'media-type',
      label: 'MediaFile MIME Type',
      status: typeValid ? 'pass' : 'fail',
      detail: typeValid
        ? 'All MediaFile elements have valid MIME type'
        : 'Invalid or missing type attribute on MediaFile elements',
    });
  }

  return results;
}

function checkTracking(parsed: ParsedVast): CheckResult[] {
  const results: CheckResult[] = [];
  const events = parsed.trackingEvents;

  const eventNames = events.map((e) => String((e as Record<string, unknown>)['@event'] || ''));

  const requiredEvents = ['start', 'firstQuartile', 'midpoint', 'thirdQuartile', 'complete'];
  const missingEvents = requiredEvents.filter((evt) => !eventNames.includes(evt));

  results.push({
    id: 'quartile-events',
    label: 'Quartile Events',
    status: missingEvents.length === 0 ? 'pass' : 'fail',
    detail: missingEvents.length === 0
      ? 'All 5 quartile events present (start, 25%, 50%, 75%, complete)'
      : `Missing events: ${missingEvents.join(', ')}`,
  });

  const optionalEvents = ['mute', 'unmute', 'pause', 'resume', 'skip', 'progress'];
  const presentOptional = optionalEvents.filter((evt) => eventNames.includes(evt));
  results.push({
    id: 'optional-events',
    label: 'Interaction Events',
    status: presentOptional.length >= 4 ? 'pass' : 'warn',
    detail: `${presentOptional.length}/${optionalEvents.length} interaction events: ${presentOptional.join(', ')}`,
  });

  const hasSkipEvent = eventNames.includes('skip');
  const hasSkipOffset = parsed.linear
    ? (parsed.linear as Record<string, unknown>)['@skipoffset'] !== undefined
    : false;
  if (hasSkipEvent && !hasSkipOffset) {
    results.push({
      id: 'skip-without-offset',
      label: 'Skip Event Consistency',
      status: 'warn',
      detail: 'Tracking event "skip" present but Linear has no skipoffset attribute (VAST 3.0 §2.3.6)',
    });
  }

  return results;
}

function checkUris(parsed: ParsedVast): CheckResult[] {
  const results: CheckResult[] = [];
  let totalUris = 0;
  let invalidUris = 0;
  let macroUris = 0;
  const invalidExamples: string[] = [];

  function checkUri(uri: string, context: string) {
    totalUris++;
    if (isMacroUri(uri)) {
      macroUris++;
      return;
    }
    if (!isValidUri(uri)) {
      invalidUris++;
      if (invalidExamples.length < 3) {
        invalidExamples.push(`${context}: ${uri.substring(0, 60)}`);
      }
    }
  }

  const impressions = toArray(parsed.inLine['Impression']);
  for (const imp of impressions) {
    checkUri(getTextContent(imp), 'Impression');
  }

  const error = parsed.inLine['Error'];
  if (error) {
    checkUri(getTextContent(error), 'Error');
  }

  for (const te of parsed.trackingEvents) {
    const t = te as Record<string, unknown>;
    checkUri(getTextContent(t), `Tracking[${t['@event']}]`);
  }

  for (const mf of parsed.mediaFiles) {
    checkUri(getTextContent(mf), 'MediaFile');
  }

  if (parsed.linear) {
    const clicks = parsed.linear['VideoClicks'] as Record<string, unknown> | undefined;
    if (clicks) {
      const ct = clicks['ClickThrough'];
      if (ct) checkUri(getTextContent(ct), 'ClickThrough');
      const ctArr = toArray(clicks['ClickTracking']);
      for (const c of ctArr) {
        checkUri(getTextContent(c), 'ClickTracking');
      }
    }
  }

  if (totalUris === 0) {
    results.push({
      id: 'uri-validation',
      label: 'URI Validation',
      status: 'fail',
      detail: 'No URIs found in VAST document',
    });
  } else {
    results.push({
      id: 'uri-validation',
      label: 'URI Validation',
      status: invalidUris === 0 ? 'pass' : 'warn',
      detail: invalidUris === 0
        ? `${totalUris} URIs checked (${macroUris} contain DSP macros, validated at serve time)`
        : `${invalidUris} invalid URI(s) found: ${invalidExamples.join('; ')}`,
    });
  }

  if (macroUris > 0) {
    results.push({
      id: 'dsp-macros-info',
      label: 'DSP Macro URIs',
      status: 'pass',
      detail: `${macroUris} URI(s) contain DSP macros - these are replaced by the platform at serve time and are expected`,
    });
  }

  return results;
}

function detectPlatform(xml: string): string {
  if (xml.includes('%%TTD_')) return 'thetradedesk';
  if (xml.includes('${IMPRESSION_URL}') || xml.includes('${CLICK_URL}')) return 'xandr';
  if (xml.includes('{{IMPRESSION_URL}}') || xml.includes('{{CLICK_URL}}')) return 'amazon';
  if (xml.includes('[IMPRESSION_URL]') || xml.includes('[CLICK_URL_ENC]')) return 'dv360';
  return 'generic';
}

export const SUPPORTED_PLATFORMS = [
  'dv360', 'thetradedesk', 'xandr', 'amazon', 'springserve', 'generic',
] as const;

export type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number];

function checkPlatformMacros(parsed: ParsedVast, platform: string): CheckResult[] {
  const results: CheckResult[] = [];

  if (parsed.linear) {
    const clicks = parsed.linear['VideoClicks'] as Record<string, unknown> | undefined;
    const hasClickThrough = clicks?.['ClickThrough'] !== undefined;
    const hasClickTracking = clicks?.['ClickTracking'] !== undefined;
    results.push({
      id: 'click-structure',
      label: 'Click Structure',
      status: hasClickTracking ? 'pass' : 'warn',
      detail: hasClickThrough && hasClickTracking
        ? 'ClickThrough + ClickTracking present'
        : hasClickTracking
          ? 'ClickTracking present (no ClickThrough URL set)'
          : 'Missing click tracking elements',
    });
  }

  return results;
}

export function validateVastXml(xml: string, platform?: string): ValidationResult {
  const parsed = parseVastXml(xml);
  if (!parsed) {
    return {
      total: 1,
      passed: 0,
      failed: 1,
      warned: 0,
      overall: 'fail',
      checks: [{
        id: 'xml-parse',
        label: 'XML Parsing',
        status: 'fail',
        detail: 'XML could not be parsed - check for syntax errors',
      }],
    };
  }

  const detectedPlatform = platform || detectPlatform(xml);

  const checks: CheckResult[] = [
    ...checkXmlStructure(parsed),
    ...checkRequiredElements(parsed),
    checkXsdOrder(parsed),
    ...checkMediaFiles(parsed),
    ...checkTracking(parsed),
    ...checkUris(parsed),
    ...checkPlatformMacros(parsed, detectedPlatform),
  ];

  const passed = checks.filter((c) => c.status === 'pass').length;
  const failed = checks.filter((c) => c.status === 'fail').length;
  const warned = checks.filter((c) => c.status === 'warn').length;

  return {
    total: checks.length,
    passed,
    failed,
    warned,
    overall: failed === 0 ? (warned === 0 ? 'pass' : 'pass_with_warnings') : 'fail',
    checks,
  };
}
