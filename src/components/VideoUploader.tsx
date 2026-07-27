'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, Film, Link, Clock, CheckCircle2, AlertCircle, Calendar, Image, Monitor } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface VideoUploaderProps {
  onUploadComplete: () => void;
}

const PLATFORMS = [
  { value: 'dv360', label: 'DV360 / CM360' },
  { value: 'thetradedesk', label: 'The Trade Desk' },
  { value: 'xandr', label: 'Xandr (AppNexus)' },
  { value: 'amazon', label: 'Amazon DSP' },
  { value: 'springserve', label: 'SpringServe (CTV)' },
  { value: 'generic', label: 'Generic (no macros)' },
];

export default function VideoUploader({ onUploadComplete }: VideoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [name, setName] = useState('');
  const [clickUrl, setClickUrl] = useState('');
  const [skipOffset, setSkipOffset] = useState('');
  const [platform, setPlatform] = useState('dv360');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [companionImageUrl, setCompanionImageUrl] = useState('');
  const [companionWidth, setCompanionWidth] = useState('300');
  const [companionHeight, setCompanionHeight] = useState('250');
  const [companionClickUrl, setCompanionClickUrl] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoMeta, setVideoMeta] = useState<{ duration: number; width: number; height: number } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    if (file.size > 500 * 1024 * 1024) { setError('Video file is too large (max 500MB)'); return; }
    if (file.size < 100_000) { setError('Video file is too small (min 100KB)'); return; }

    setSelectedFile(file);
    setError('');
    setSuccess('');
    setName(file.name.replace(/\.[^.]+$/, ''));

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      setVideoMeta({ duration: video.duration, width: video.videoWidth, height: video.videoHeight });
    };
    video.src = objectUrl;
  }, []);

  const clearSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setVideoMeta(null);
    setPreviewUrl(null);
    setError('');
    setSuccess('');
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/mp4': ['.mp4'], 'video/quicktime': ['.mov'] },
    maxFiles: 1,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!selectedFile || !name) return;

    setUploading(true);
    setError('');
    setSuccess('');
    setProgress(0);

    try {
      setStage('Uploading video to storage...');
      const supabase = createClient();
      const ext = selectedFile.name.match(/\.[^.]+$/)?.[0] || '.mp4';
      const fileName = `${uuidv4()}${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, selectedFile, { contentType: selectedFile.type, cacheControl: '31536000', upsert: false });

      if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);
      setProgress(70);

      setStage('Creating ad record...');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          name,
          clickThroughUrl: clickUrl || undefined,
          skipOffset: skipOffset || undefined,
          duration: videoMeta?.duration,
          width: videoMeta?.width,
          height: videoMeta?.height,
          fileSize: selectedFile.size,
          platform,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          companionImageUrl: companionImageUrl || undefined,
          companionWidth: companionImageUrl ? companionWidth : undefined,
          companionHeight: companionImageUrl ? companionHeight : undefined,
          companionClickUrl: companionClickUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create ad record');

      setProgress(100);
      setStage('');
      setSuccess(`Ad "${name}" created successfully! VAST tag is ready.`);

      setTimeout(() => {
        clearSelection();
        setName(''); setClickUrl(''); setSkipOffset('');
        setPlatform('dv360'); setStartDate(''); setEndDate('');
        setCompanionImageUrl(''); setCompanionClickUrl('');
        setShowAdvanced(false); setSuccess('');
        onUploadComplete();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setProgress(0);
      setStage('');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-blue-500" />
        Upload Video Ad
      </h2>

      {!selectedFile ? (
        <div {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
            isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 scale-[1.01]'
            : 'border-zinc-300 dark:border-zinc-700 hover:border-blue-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
          }`}>
          <input {...getInputProps()} />
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
            <Film className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-zinc-700 dark:text-zinc-300 font-medium text-base">
            {isDragActive ? 'Drop your video here' : 'Drag & drop an MP4 video, or click to select'}
          </p>
          <p className="text-sm text-zinc-400 mt-2">MP4 or MOV — max 500MB</p>
        </div>
      ) : (
        <div className="space-y-4">
          {previewUrl && (
            <div className="rounded-lg overflow-hidden bg-black aspect-video max-h-48 flex items-center justify-center">
              <video src={previewUrl} className="max-h-48 max-w-full" controls muted preload="metadata" />
            </div>
          )}

          <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <Film className="w-8 h-8 text-blue-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{selectedFile.name}</p>
              <p className="text-sm text-zinc-500">
                {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                {videoMeta && ` · ${Math.round(videoMeta.duration)}s · ${videoMeta.width}x${videoMeta.height}`}
              </p>
            </div>
            <button onClick={clearSelection} disabled={uploading} className="text-sm text-zinc-500 hover:text-red-500 disabled:opacity-50">Remove</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ad Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="My CTV Ad" disabled={uploading} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                <Monitor className="w-3.5 h-3.5" /> DSP Platform
              </label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled={uploading}>
                {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                <Link className="w-3.5 h-3.5" /> Click-Through URL <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <input type="url" value={clickUrl} onChange={(e) => setClickUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="https://example.com/landing" disabled={uploading} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Skip Offset (seconds) <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <input type="number" value={skipOffset} onChange={(e) => setSkipOffset(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="5" min="0" disabled={uploading} />
            </div>
          </div>

          {/* Scheduling */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Start Date <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled={uploading} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> End Date <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled={uploading} />
            </div>
          </div>

          {/* Advanced options toggle */}
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            <Image className="w-3.5 h-3.5" />
            {showAdvanced ? 'Hide' : 'Show'} Companion Ad Settings
          </button>

          {showAdvanced && (
            <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Companion Banner Image URL</label>
                <input type="url" value={companionImageUrl} onChange={(e) => setCompanionImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="https://example.com/banner-300x250.png" disabled={uploading} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Width</label>
                  <input type="number" value={companionWidth} onChange={(e) => setCompanionWidth(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm outline-none"
                    disabled={uploading} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Height</label>
                  <input type="number" value={companionHeight} onChange={(e) => setCompanionHeight(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm outline-none"
                    disabled={uploading} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Click URL</label>
                  <input type="url" value={companionClickUrl} onChange={(e) => setCompanionClickUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm outline-none"
                    placeholder="https://" disabled={uploading} />
                </div>
              </div>
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">{stage}</span>
                <span className="text-zinc-400">{progress}%</span>
              </div>
              <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <button onClick={handleUpload} disabled={uploading || !name}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
            {uploading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>)
              : (<><Upload className="w-4 h-4" /> Upload & Generate VAST Tag</>)}
          </button>
        </div>
      )}

      {success && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <video ref={videoRef} className="hidden" />
    </div>
  );
}
