'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Copy, Download, Trash2, ExternalLink, Code, Check,
  ChevronDown, ChevronUp, BarChart3, Eye, MousePointerClick,
  Play, Activity, Pencil, X, Save, ShieldCheck,
  CheckCircle2, XCircle, AlertTriangle, CopyPlus, QrCode,
  MonitorPlay, Radio, Calendar, Image, FileDown,
  Pause, SkipForward, Volume2, VolumeX, Maximize,
  Search, Filter, MoreHorizontal, Power, Archive,
  FileText, ChevronRight,
} from 'lucide-react';
import QRCode from 'qrcode';
import type { Ad } from '@/lib/supabase/types';

// ─── Types ───

interface ValidationCheck {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'warn';
  detail: string;
}

interface ValidationResult {
  adId: string;
  total: number;
  passed: number;
  failed: number;
  warned: number;
  overall: 'pass' | 'pass_with_warnings' | 'fail';
  checks: ValidationCheck[];
}

interface AdStats {
  impression?: number;
  start?: number;
  firstQuartile?: number;
  midpoint?: number;
  thirdQuartile?: number;
  complete?: number;
  click?: number;
  skip?: number;
  [key: string]: number | undefined;
}

interface LiveEvent {
  event_type: string;
  timestamp: string;
  ip_address: string | null;
  user_agent: string | null;
}

interface AdsListProps {
  ads: Ad[];
  onRefresh: () => void;
}

const PLATFORM_LABELS: Record<string, string> = {
  dv360: 'DV360',
  thetradedesk: 'TTD',
  xandr: 'Xandr',
  amazon: 'Amazon',
  springserve: 'SpringServe',
  generic: 'Generic',
};

const STATUS_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400' },
  { value: 'draft', label: 'Draft', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-400' },
  { value: 'archived', label: 'Archived', color: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' },
];

// ─── Small components ───

function StatBadge({ icon: Icon, label, value, suffix }: {
  icon: React.ElementType; label: string; value: string; suffix?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
      <Icon className="w-3 h-3" />
      <span>{label}</span>
      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{value}{suffix}</span>
    </div>
  );
}

function CompletionBar({ stats }: { stats: AdStats }) {
  const impressions = stats.impression || 0;
  if (impressions === 0) return null;

  const stages = [
    { key: 'start', label: 'Start', pct: ((stats.start || 0) / impressions) * 100 },
    { key: 'firstQuartile', label: '25%', pct: ((stats.firstQuartile || 0) / impressions) * 100 },
    { key: 'midpoint', label: '50%', pct: ((stats.midpoint || 0) / impressions) * 100 },
    { key: 'thirdQuartile', label: '75%', pct: ((stats.thirdQuartile || 0) / impressions) * 100 },
    { key: 'complete', label: '100%', pct: ((stats.complete || 0) / impressions) * 100 },
  ];

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-zinc-500">
        <span>View-through funnel</span>
        <span>{impressions.toLocaleString()} impressions</span>
      </div>
      <div className="flex gap-1 h-6">
        {stages.map((s) => (
          <div key={s.key} className="flex-1 relative group">
            <div className="h-full bg-zinc-200 dark:bg-zinc-700 rounded overflow-hidden">
              <div className="h-full bg-blue-500 rounded transition-all" style={{ width: `${Math.min(s.pct, 100)}%` }} />
            </div>
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-zinc-400 whitespace-nowrap">
              {s.label}: {s.pct.toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Dropdown Menu ───

function DropdownMenu({ children, trigger }: { children: React.ReactNode; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-20 py-1"
          onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}

function DropdownItem({ icon: Icon, label, onClick, danger }: {
  icon: React.ElementType; label: string; onClick: () => void; danger?: boolean;
}) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
        danger ? 'text-red-600 dark:text-red-400' : 'text-zinc-700 dark:text-zinc-300'
      }`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

// ─── Status Selector ───

function StatusSelector({ ad, onRefresh }: { ad: Ad; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const current = STATUS_OPTIONS.find((s) => s.value === ad.status) || STATUS_OPTIONS[1];

  const changeStatus = async (status: string) => {
    if (status === ad.status) { setOpen(false); return; }
    setSaving(true);
    try {
      await fetch(`/api/ads/${ad.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      onRefresh();
    } finally {
      setSaving(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={saving}
        className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded cursor-pointer transition-colors hover:ring-2 hover:ring-blue-500/30 ${current.color}`}
      >
        {saving ? '...' : current.label}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-28 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-20 py-1">
          {STATUS_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => changeStatus(opt.value)}
              className={`w-full text-left px-3 py-1.5 text-[11px] font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                opt.value === ad.status ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400'
              }`}>
              {opt.value === ad.status && <Check className="w-3 h-3 inline mr-1" />}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── QR Code Modal ───

function QrModal({ url, adName, onClose }: { url: string; adName: string; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, { width: 256, margin: 2 });
    }
  }, [url]);

  const downloadQr = () => {
    if (!canvasRef.current) return;
    const a = document.createElement('a');
    a.href = canvasRef.current.toDataURL('image/png');
    a.download = `qr-${adName.toLowerCase().replace(/\s+/g, '-')}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">VAST Tag QR Code</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{adName}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex justify-center mb-3 bg-white p-3 rounded-lg">
          <canvas ref={canvasRef} />
        </div>
        <p className="text-xs text-zinc-500 text-center break-all mb-3">{url}</p>
        <div className="flex gap-2">
          <button onClick={downloadQr}
            className="flex-1 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Download PNG
          </button>
          <button onClick={() => { navigator.clipboard.writeText(url); }}
            className="flex-1 py-2 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center gap-1.5">
            <Copy className="w-3.5 h-3.5" /> Copy URL
          </button>
        </div>
        <p className="text-[11px] text-zinc-400 text-center mt-3">Scan from a Smart TV to test the VAST tag directly</p>
      </div>
    </div>
  );
}

// ─── VAST Preview Player ───

function VastPreviewPlayer({ ad }: { ad: Ad }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [quartilesFired, setQuartilesFired] = useState<Set<string>>(new Set());
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [showSkip, setShowSkip] = useState(false);
  const [skippable, setSkippable] = useState(false);

  const logEvent = useCallback((evt: string) => {
    const ts = new Date().toLocaleTimeString();
    setEventLog((prev) => [`[${ts}] ${evt}`, ...prev].slice(0, 30));
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    const pct = v.currentTime / v.duration;
    const newQ = new Set(quartilesFired);
    if (pct >= 0.01 && !newQ.has('start')) { newQ.add('start'); logEvent('start'); }
    if (pct >= 0.25 && !newQ.has('firstQuartile')) { newQ.add('firstQuartile'); logEvent('firstQuartile'); }
    if (pct >= 0.50 && !newQ.has('midpoint')) { newQ.add('midpoint'); logEvent('midpoint'); }
    if (pct >= 0.75 && !newQ.has('thirdQuartile')) { newQ.add('thirdQuartile'); logEvent('thirdQuartile'); }
    if (newQ.size !== quartilesFired.size) setQuartilesFired(newQ);
    if (ad.skip_offset && v.currentTime >= ad.skip_offset && !skippable) {
      setSkippable(true);
      setShowSkip(true);
    }
  }, [quartilesFired, ad.skip_offset, skippable, logEvent]);

  const handlePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) { v.pause(); logEvent('pause'); }
    else { v.play(); logEvent(currentTime > 0 ? 'resume' : 'loaded'); }
    setPlaying(!playing);
  };

  const handleEnded = () => {
    setPlaying(false);
    logEvent('complete');
  };

  const handleSkip = () => {
    if (videoRef.current) { videoRef.current.pause(); setPlaying(false); }
    logEvent('skip');
    setShowSkip(false);
  };

  const handleFullscreen = () => {
    videoRef.current?.requestFullscreen?.();
    logEvent('playerExpand');
  };

  const progress = videoRef.current?.duration ? (currentTime / videoRef.current.duration) * 100 : 0;

  return (
    <div className="p-4 space-y-3">
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video max-h-64">
        <video
          ref={videoRef}
          src={ad.video_url}
          muted={muted}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          className="w-full h-full object-contain"
          preload="metadata"
        />
        {showSkip && (
          <button onClick={handleSkip}
            className="absolute top-3 right-3 px-3 py-1.5 bg-white/90 text-black text-xs font-semibold rounded shadow hover:bg-white flex items-center gap-1">
            <SkipForward className="w-3 h-3" /> Skip Ad
          </button>
        )}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <div className="h-1 bg-white/30 rounded-full mb-2 overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePlay} className="text-white hover:text-blue-400">
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button onClick={() => { setMuted(!muted); logEvent(muted ? 'unmute' : 'mute'); }} className="text-white hover:text-blue-400">
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <span className="text-white text-[10px] ml-1">
              {Math.floor(currentTime)}s / {Math.floor(ad.video_duration)}s
            </span>
            <div className="flex-1" />
            <button onClick={handleFullscreen} className="text-white hover:text-blue-400">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['loaded', 'start', 'firstQuartile', 'midpoint', 'thirdQuartile', 'complete'].map((q) => (
          <span key={q} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            quartilesFired.has(q) ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400'
            : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800'
          }`}>{q}</span>
        ))}
      </div>

      {eventLog.length > 0 && (
        <div className="bg-zinc-950 rounded-lg p-3 max-h-32 overflow-y-auto">
          <p className="text-[10px] text-zinc-500 mb-1 font-semibold">Event Log</p>
          {eventLog.map((e, i) => (
            <p key={i} className="text-[11px] text-green-400 font-mono">{e}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Validation Panel ───

function ValidationPanel({ result, validating }: { result: ValidationResult | null; validating: boolean }) {
  if (validating) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-zinc-500">Validating VAST tag...</p>
      </div>
    );
  }
  if (!result) return null;

  const overallColor = result.overall === 'pass'
    ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
    : result.overall === 'pass_with_warnings'
      ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800'
      : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800';
  const overallLabel = result.overall === 'pass' ? 'All checks passed'
    : result.overall === 'pass_with_warnings' ? 'Passed with warnings' : 'Validation failed';
  const OverallIcon = result.overall === 'fail' ? XCircle : result.overall === 'pass_with_warnings' ? AlertTriangle : CheckCircle2;
  const overallIconColor = result.overall === 'pass' ? 'text-green-600 dark:text-green-400'
    : result.overall === 'pass_with_warnings' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';

  return (
    <div className="p-4 space-y-4">
      <div className={`flex items-center gap-3 p-3 rounded-lg border ${overallColor}`}>
        <OverallIcon className={`w-6 h-6 ${overallIconColor}`} />
        <div>
          <p className="font-semibold text-sm">{overallLabel}</p>
          <p className="text-xs text-zinc-500">{result.passed} passed · {result.failed} failed · {result.warned} warnings</p>
        </div>
      </div>
      <div className="space-y-1">
        {result.checks.map((check) => (
          <div key={check.id} className="flex items-start gap-2 py-1.5 px-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
            {check.status === 'pass' ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              : check.status === 'fail' ? <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              : <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />}
            <div className="min-w-0">
              <p className="text-xs font-medium">{check.label}</p>
              <p className="text-[11px] text-zinc-500 truncate">{check.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Live Events Panel ───

function LiveEventsPanel({ adId }: { adId: string }) {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [isLive, setIsLive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch(`/api/stats/${adId}/live?since=${new Date(Date.now() - 60000).toISOString()}`);
      const data = await res.json();
      if (data.events) setEvents(data.events);
    } catch { /* ignore */ }
  }, [adId]);

  const toggleLive = () => {
    if (isLive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsLive(false);
    } else {
      fetchLive();
      intervalRef.current = setInterval(fetchLive, 3000);
      setIsLive(true);
    }
  };

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Radio className={`w-4 h-4 ${isLive ? 'text-red-500 animate-pulse' : 'text-zinc-400'}`} />
          Live Events
        </h4>
        <button onClick={toggleLive}
          className={`text-xs px-3 py-1 rounded-md font-medium ${isLive ? 'bg-red-600 text-white' : 'bg-green-600 text-white hover:bg-green-700'}`}>
          {isLive ? 'Stop' : 'Start Live'}
        </button>
      </div>
      {events.length === 0 ? (
        <p className="text-xs text-zinc-400 text-center py-4">
          {isLive ? 'Waiting for events...' : 'Click "Start Live" to monitor events in real-time'}
        </p>
      ) : (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {events.map((evt, i) => (
            <div key={i} className="flex items-center gap-2 py-1 px-2 rounded text-xs bg-zinc-50 dark:bg-zinc-800/50">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <span className="font-medium">{evt.event_type}</span>
              <span className="text-zinc-400 text-[10px] ml-auto">{new Date(evt.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Expanded Panel ───

type ViewTab = 'vast' | 'stats' | 'validate' | 'preview' | 'live';

function ExpandedPanel({
  ad, view, setView, vastXml, stats, impressions, clicks, completes, ctr, vcr,
  copiedId, copiedType, onCopyVast, onCopyUrl, onFetchVast,
  validationResult, validating, onValidate,
}: {
  ad: Ad; view: ViewTab; setView: (v: ViewTab) => void;
  vastXml?: string; stats: AdStats; impressions: number; clicks: number;
  completes: number; ctr: string; vcr: string;
  copiedId: string | null; copiedType: 'xml' | 'url' | null;
  onCopyVast: () => void; onCopyUrl: () => void; onFetchVast: () => void;
  validationResult: ValidationResult | null; validating: boolean; onValidate: () => void;
}) {
  const tabs: { key: ViewTab; label: string; icon: React.ElementType; action?: () => void }[] = [
    { key: 'vast', label: 'VAST XML', icon: Code, action: onFetchVast },
    { key: 'stats', label: 'Analytics', icon: BarChart3 },
    { key: 'validate', label: 'Validate', icon: ShieldCheck, action: onValidate },
    { key: 'preview', label: 'Preview', icon: MonitorPlay },
    { key: 'live', label: 'Live', icon: Radio },
  ];

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="px-3 pt-2 pb-0 bg-zinc-50 dark:bg-zinc-800/50 overflow-x-auto">
        <div className="flex items-center gap-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = view === tab.key;
            return (
              <button key={tab.key}
                onClick={() => { setView(tab.key); tab.action?.(); }}
                className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-t-lg font-medium transition-colors ${
                  active
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 border border-b-0 border-zinc-200 dark:border-zinc-700'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}>
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}

          {view === 'vast' && (
            <div className="flex gap-1.5 ml-auto shrink-0 pb-1">
              <button onClick={onCopyVast} className="text-xs px-2.5 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1">
                {copiedId === ad.id && copiedType === 'xml' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedId === ad.id && copiedType === 'xml' ? 'Copied!' : 'Copy XML'}
              </button>
              <button onClick={onCopyUrl} className="text-xs px-2.5 py-1 bg-zinc-600 text-white rounded-md hover:bg-zinc-700 flex items-center gap-1">
                {copiedId === ad.id && copiedType === 'url' ? <Check className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
                {copiedId === ad.id && copiedType === 'url' ? 'Copied!' : 'Copy URL'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900">
        {view === 'vast' && vastXml && (
          <pre className="p-4 text-xs overflow-x-auto bg-zinc-950 text-green-400 max-h-96 overflow-y-auto font-mono">
            <code>{vastXml}</code>
          </pre>
        )}

        {view === 'stats' && (
          <div className="p-4 space-y-4">
            {impressions === 0 ? (
              <div className="text-center py-6 text-zinc-400">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tracking data yet</p>
                <p className="text-xs mt-1">Events will appear here once the VAST tag is served</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">
                    <p className="text-xs text-zinc-500">Impressions</p>
                    <p className="text-xl font-bold">{impressions.toLocaleString()}</p>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">
                    <p className="text-xs text-zinc-500">Clicks</p>
                    <p className="text-xl font-bold">{clicks.toLocaleString()}</p>
                    <p className="text-[10px] text-zinc-400">CTR {ctr}%</p>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">
                    <p className="text-xs text-zinc-500">Completions</p>
                    <p className="text-xl font-bold">{completes.toLocaleString()}</p>
                    <p className="text-[10px] text-zinc-400">VCR {vcr}%</p>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">
                    <p className="text-xs text-zinc-500">Skips</p>
                    <p className="text-xl font-bold">{(stats.skip || 0).toLocaleString()}</p>
                  </div>
                </div>
                <CompletionBar stats={stats} />
              </>
            )}
          </div>
        )}

        {view === 'validate' && <ValidationPanel result={validationResult} validating={validating} />}
        {view === 'preview' && <VastPreviewPlayer ad={ad} />}
        {view === 'live' && <LiveEventsPanel adId={ad.id} />}
      </div>
    </div>
  );
}

// ─── Main Component ───

export default function AdsList({ ads, onRefresh }: AdsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [vastCache, setVastCache] = useState<Record<string, string>>({});
  const [statsCache, setStatsCache] = useState<Record<string, AdStats>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<'xml' | 'url' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editClickUrl, setEditClickUrl] = useState('');
  const [view, setView] = useState<ViewTab>('vast');
  const [validationCache, setValidationCache] = useState<Record<string, ValidationResult>>({});
  const [validating, setValidating] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrAdName, setQrAdName] = useState('');
  const [duplicating, setDuplicating] = useState<string | null>(null);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    ads.forEach((ad) => {
      if (!statsCache[ad.id]) {
        fetch(`/api/stats/${ad.id}`)
          .then((res) => res.json())
          .then((data) => { setStatsCache((prev) => ({ ...prev, [ad.id]: data.stats || {} })); })
          .catch(() => {});
      }
    });
  }, [ads]);

  const filteredAds = ads.filter((ad) => {
    if (searchQuery && !ad.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterPlatform !== 'all' && (ad.platform || 'dv360') !== filterPlatform) return false;
    if (filterStatus !== 'all' && ad.status !== filterStatus) return false;
    return true;
  });

  const fetchVast = async (id: string) => {
    if (vastCache[id]) return vastCache[id];
    const res = await fetch(`/api/vast/${id}`);
    const xml = await res.text();
    setVastCache((prev) => ({ ...prev, [id]: xml }));
    return xml;
  };

  const runValidation = async (id: string) => {
    if (validationCache[id]) return;
    setValidating(id);
    try {
      const res = await fetch(`/api/vast/${id}/validate`);
      const data = await res.json();
      setValidationCache((prev) => ({ ...prev, [id]: data }));
    } catch { /* */ } finally { setValidating(null); }
  };

  const toggleExpand = async (id: string, tab: ViewTab = 'vast') => {
    if (expandedId === id && view === tab) { setExpandedId(null); return; }
    setExpandedId(id);
    setView(tab);
    if (tab === 'vast') await fetchVast(id);
    if (tab === 'validate') await runValidation(id);
  };

  const copyVast = async (id: string) => {
    const xml = await fetchVast(id);
    await navigator.clipboard.writeText(xml);
    setCopiedId(id); setCopiedType('xml');
    setTimeout(() => { setCopiedId(null); setCopiedType(null); }, 2000);
  };

  const copyVastUrl = async (id: string) => {
    const ad = ads.find((a) => a.id === id);
    const platform = ad?.platform || 'dv360';
    let url = `${window.location.origin}/api/vast/${id}`;
    if (platform === 'springserve') {
      url += '?cb={{CACHEBUSTER}}&ip={{IP}}&ua={{USER_AGENT}}&app_bundle={{APP_BUNDLE}}&app_name={{APP_NAME}}&app_store_url={{APP_STORE_URL}}&did={{DEVICE_ID}}&ifa_type={{IFA_TYPE}}&device_make={{DEVICE_MAKE}}&device_model={{DEVICE_MODEL}}&os={{OPERATING_SYSTEM}}&osv={{OPERATING_SYSTEM_VERSION}}&dnt={{DNT}}&lmt={{LMT}}&gdpr={{GDPR}}&gdpr_consent={{CONSENT}}&us_privacy={{US_PRIVACY}}';
    }
    await navigator.clipboard.writeText(url);
    setCopiedId(id); setCopiedType('url');
    setTimeout(() => { setCopiedId(null); setCopiedType(null); }, 2000);
  };

  const downloadVast = async (id: string, name: string) => {
    const xml = await fetchVast(id);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adsmood-vast-${name.toLowerCase().replace(/\s+/g, '-')}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteAd = async (id: string) => {
    if (!confirm('Delete this ad? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await fetch('/api/ads', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      onRefresh();
    } finally { setDeleting(null); }
  };

  const duplicateAd = async (id: string) => {
    setDuplicating(id);
    try {
      const res = await fetch(`/api/ads/${id}/duplicate`, { method: 'POST' });
      if (res.ok) onRefresh();
    } finally { setDuplicating(null); }
  };

  const startEdit = (ad: Ad) => {
    setEditingId(ad.id);
    setEditName(ad.name);
    setEditClickUrl(ad.click_through_url || '');
  };

  const saveEdit = async (id: string) => {
    const updates: Record<string, string> = {};
    const ad = ads.find((a) => a.id === id);
    if (!ad) return;
    if (editName !== ad.name) updates.name = editName;
    if (editClickUrl !== (ad.click_through_url || '')) updates.click_through_url = editClickUrl;
    if (Object.keys(updates).length > 0) {
      await fetch(`/api/ads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
      setVastCache((prev) => { const next = { ...prev }; delete next[id]; return next; });
      setValidationCache((prev) => { const next = { ...prev }; delete next[id]; return next; });
      onRefresh();
    }
    setEditingId(null);
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const isScheduled = (ad: Ad) => {
    if (!ad.start_date && !ad.end_date) return null;
    const now = new Date();
    if (ad.start_date && new Date(ad.start_date) > now) return 'scheduled';
    if (ad.end_date && new Date(ad.end_date) < now) return 'ended';
    return 'running';
  };

  if (ads.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-10 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <Code className="w-8 h-8 text-zinc-400" />
        </div>
        <p className="text-zinc-500 font-medium text-base">No ads yet</p>
        <p className="text-zinc-400 text-sm mt-1">Upload a video to generate your first VAST tag</p>
      </div>
    );
  }

  const activeFilters = (filterPlatform !== 'all' ? 1 : 0) + (filterStatus !== 'all' ? 1 : 0);

  return (
    <div className="space-y-3">
      {/* Search, filter & export bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search ads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
              showFilters || activeFilters > 0
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}>
            <Filter className="w-3.5 h-3.5" />
            Filters
            {activeFilters > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">{activeFilters}</span>
            )}
          </button>

          <DropdownMenu trigger={
            <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800">
              <FileDown className="w-3.5 h-3.5" />
              Export
              <ChevronDown className="w-3 h-3" />
            </button>
          }>
            <a href="/api/vast/export?format=csv" download
              className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
              <FileText className="w-3.5 h-3.5" /> VAST Tags CSV
            </a>
            <a href="/api/reports?format=csv" download
              className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
              <BarChart3 className="w-3.5 h-3.5" /> Analytics Report (CSV)
            </a>
            <a href="/api/reports?format=json" download
              className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
              <Download className="w-3.5 h-3.5" /> Full Report (JSON)
            </a>
          </DropdownMenu>
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-zinc-500">Platform:</label>
            <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)}
              className="text-xs px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none">
              <option value="all">All</option>
              {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-zinc-500">Status:</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none">
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          {activeFilters > 0 && (
            <button onClick={() => { setFilterPlatform('all'); setFilterStatus('all'); }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline ml-auto">
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Results count when filtered */}
      {(searchQuery || activeFilters > 0) && (
        <p className="text-xs text-zinc-500">
          Showing {filteredAds.length} of {ads.length} ads
          {searchQuery && <> matching &quot;{searchQuery}&quot;</>}
        </p>
      )}

      {filteredAds.length === 0 && ads.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center">
          <Search className="w-8 h-8 mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
          <p className="text-zinc-500 text-sm">No ads match your filters</p>
          <button onClick={() => { setSearchQuery(''); setFilterPlatform('all'); setFilterStatus('all'); }}
            className="text-xs text-blue-600 hover:underline mt-2">
            Clear all filters
          </button>
        </div>
      )}

      {filteredAds.map((ad) => {
        const stats = statsCache[ad.id] || {};
        const impressions = stats.impression || 0;
        const clicks = stats.click || 0;
        const completes = stats.complete || 0;
        const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : '0.0';
        const vcr = impressions > 0 ? ((completes / impressions) * 100).toFixed(1) : '0.0';
        const schedule = isScheduled(ad);
        const platform = ad.platform || 'dv360';
        const isExpanded = expandedId === ad.id;

        return (
          <div key={ad.id}
            className={`bg-white dark:bg-zinc-900 rounded-xl border overflow-hidden transition-all ${
              isExpanded
                ? 'border-blue-300 dark:border-blue-800 shadow-md ring-1 ring-blue-200 dark:ring-blue-900'
                : 'border-zinc-200 dark:border-zinc-800 hover:shadow-md'
            }`}>
            <div className="p-4">
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Thumbnail */}
                <div className="w-20 h-12 sm:w-24 sm:h-14 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 flex items-center justify-center relative group cursor-pointer"
                  onClick={() => toggleExpand(ad.id, 'preview')}>
                  <video src={ad.video_url} className="w-full h-full object-cover" muted preload="metadata"
                    onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
                    onMouseLeave={(e) => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <Play className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {ad.companion_image_url && (
                    <div className="absolute bottom-0.5 right-0.5">
                      <Image className="w-3 h-3 text-white drop-shadow" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {editingId === ad.id ? (
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <input value={editName} onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 min-w-0 px-2 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(ad.id); if (e.key === 'Escape') setEditingId(null); }} />
                        <button onClick={() => saveEdit(ad.id)} className="p-1 text-green-500 hover:text-green-600"><Save className="w-4 h-4" /></button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-zinc-400 hover:text-zinc-600"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-semibold truncate max-w-[200px] sm:max-w-none">{ad.name}</h3>
                        <StatusSelector ad={ad} onRefresh={onRefresh} />
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                          {PLATFORM_LABELS[platform] || platform}
                        </span>
                        {schedule && (
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                            schedule === 'scheduled' ? 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400'
                            : schedule === 'running' ? 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400'
                            : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}>
                            <Calendar className="w-2.5 h-2.5" />
                            {schedule === 'scheduled' ? 'Scheduled' : schedule === 'running' ? 'In Flight' : 'Ended'}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Metadata row */}
                  <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 flex-wrap">
                    <span>{ad.video_width}x{ad.video_height}</span>
                    <span className="text-zinc-300 dark:text-zinc-600">·</span>
                    <span>{formatDuration(ad.video_duration)}</span>
                    <span className="text-zinc-300 dark:text-zinc-600">·</span>
                    <span className="hidden sm:inline">VAST {ad.vast_version}</span>
                    <span className="hidden sm:inline text-zinc-300 dark:text-zinc-600">·</span>
                    <span>{formatDate(ad.created_at)}</span>
                  </div>

                  {/* Stats row */}
                  {impressions > 0 && (
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <StatBadge icon={Eye} label="" value={impressions.toLocaleString()} suffix=" views" />
                      <StatBadge icon={MousePointerClick} label="CTR" value={ctr} suffix="%" />
                      <StatBadge icon={Play} label="VCR" value={vcr} suffix="%" />
                    </div>
                  )}
                </div>

                {/* Action buttons - primary visible, secondary in dropdown */}
                <div className="flex items-center gap-0.5 shrink-0">
                  {/* Primary actions - always visible */}
                  <button onClick={() => copyVastUrl(ad.id)}
                    className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" title="Copy VAST URL">
                    {copiedId === ad.id && copiedType === 'url' ? <Check className="w-4 h-4 text-green-500" /> : <ExternalLink className="w-4 h-4 text-zinc-400" />}
                  </button>
                  <button onClick={() => copyVast(ad.id)}
                    className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" title="Copy VAST XML">
                    {copiedId === ad.id && copiedType === 'xml' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                  </button>

                  {/* Expand toggle */}
                  <button onClick={() => toggleExpand(ad.id, 'vast')}
                    className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" title={isExpanded ? 'Collapse' : 'Expand'}>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-blue-500" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                  </button>

                  {/* More menu */}
                  <DropdownMenu trigger={
                    <button className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" title="More actions">
                      <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                    </button>
                  }>
                    <DropdownItem icon={Pencil} label="Edit name" onClick={() => startEdit(ad)} />
                    <DropdownItem icon={CopyPlus} label="Duplicate" onClick={() => duplicateAd(ad.id)} />
                    <DropdownItem icon={Download} label="Download VAST XML" onClick={() => downloadVast(ad.id, ad.name)} />
                    <DropdownItem icon={QrCode} label="QR Code" onClick={() => { setQrAdName(ad.name); setQrUrl(`${window.location.origin}/api/vast/${ad.id}`); }} />
                    <DropdownItem icon={ShieldCheck} label="Validate VAST" onClick={() => toggleExpand(ad.id, 'validate')} />
                    <DropdownItem icon={MonitorPlay} label="Preview Player" onClick={() => toggleExpand(ad.id, 'preview')} />
                    <DropdownItem icon={BarChart3} label="Analytics" onClick={() => toggleExpand(ad.id, 'stats')} />
                    <DropdownItem icon={Radio} label="Live Events" onClick={() => toggleExpand(ad.id, 'live')} />
                    <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />
                    <DropdownItem icon={Trash2} label="Delete" onClick={() => deleteAd(ad.id)} danger />
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {isExpanded && (
              <ExpandedPanel
                ad={ad} view={view} setView={setView}
                vastXml={vastCache[ad.id]} stats={stats}
                impressions={impressions} clicks={clicks} completes={completes} ctr={ctr} vcr={vcr}
                copiedId={copiedId} copiedType={copiedType}
                onCopyVast={() => copyVast(ad.id)} onCopyUrl={() => copyVastUrl(ad.id)} onFetchVast={() => fetchVast(ad.id)}
                validationResult={validationCache[ad.id] || null} validating={validating === ad.id} onValidate={() => runValidation(ad.id)}
              />
            )}
          </div>
        );
      })}

      {qrUrl && <QrModal url={qrUrl} adName={qrAdName} onClose={() => setQrUrl(null)} />}
    </div>
  );
}
