export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ad {
  id: string;
  project_id: string | null;
  name: string;
  video_url: string;
  video_duration: number;
  video_width: number;
  video_height: number;
  video_codec: string;
  video_bitrate: number;
  click_through_url: string | null;
  skip_offset: number | null;
  vast_version: string;
  status: 'draft' | 'active' | 'archived';
  platform: 'dv360' | 'thetradedesk' | 'xandr' | 'amazon' | 'springserve' | 'generic';
  start_date: string | null;
  end_date: string | null;
  companion_image_url: string | null;
  companion_width: number | null;
  companion_height: number | null;
  companion_click_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrackingEvent {
  id: string;
  ad_id: string;
  event_type: string;
  timestamp: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
}

export type AdInsert = Omit<Ad, 'id' | 'created_at' | 'updated_at'>;
export type AdUpdate = Partial<Omit<Ad, 'id' | 'created_at' | 'updated_at'>>;
