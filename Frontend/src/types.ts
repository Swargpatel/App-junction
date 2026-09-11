export interface Group {
  _id: string;
  group_name: string;
  description: string;
  icon?: string;
  color_code: string;
  status: 'ACTIVE' | 'INACTIVE';
  app_count?: number;
  apps?: any[];
  created_at: string;
}

export interface App {
  _id: string;
  app_name: string;
  package_name: string;
  android_package_name?: string;
  ios_bundle_id?: string;
  bundle_id?: string;
  group_id?: Group | string | null;
  app_icon?: string;
  logo_photo?: string;
  app_age_rating?: string;
  platform: 'ANDROID' | 'IOS' | 'BOTH';
  app_key?: string;
  api_key: string;
  api_secret: string;
  app_version: string;
  android_latest_build_number?: string;
  ios_latest_build_number?: string;
  is_android_live?: boolean;
  is_iOS_live?: boolean;
  googleplay_link?: string;
  appstore_link?: string;
  store_url_android?: string;
  store_url_ios?: string;
  google_play_account?: string;
  apple_app_store_account?: string;
  ads_account?: string;
  Firebase_push_key?: string;
  firebase_server_key?: string;
  firebase_service_account_json?: string;
  firebase_project_id?: string;
  firebase_client_email?: string;
  is_push_marketing?: boolean;
  is_cross_push_marketing?: boolean;
  is_cross_app_ads_banner_marketing?: boolean;
  is_adsbanner_marketing?: boolean;
  Own_notification_timePrefrance?: string;
  Cross_app_notification_time_prefrance?: string;
  Own_app_notification_frequancy?: string;
  Cross_app_notification_frequancy?: string;
  Android_ads_policy_URL?: string;
  iOS_ads_policy_URL?: string;
  android_video_url?: string;
  ios_video_url?: string;
  status: 'ACTIVE' | 'INACTIVE';
  create_date?: string;
  update_date?: string;
  created_at?: string;
  [key: string]: any;
}

export interface DashboardOverview {
  total_installs: number;
  today_installs: number;
  repeat_customers: number;
  today_revenue: number;
  today_subscription_revenue: number;
  today_consumable_revenue: number;
  active_subscriptions: number;
  all_time_revenue: number;
  pending_crashes: number;
}

export interface RevenueTrendItem {
  _id: string; // date YYYY-MM-DD
  total_revenue: number;
  subscription_revenue: number;
  consumable_revenue: number;
  purchase_count: number;
}

export interface AppRevenueItem {
  app_id: string;
  app_name: string;
  package_name: string;
  revenue: number;
  transactions: number;
}

export interface CancellationStats {
  active_subscriptions: number;
  cancelled_subscriptions: number;
  churn_rate_percent: number;
  reasons_breakdown: { _id: string; count: number }[];
  recent_cancellations: any[];
  cancellations_list?: any[];
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface CrashLog {
  _id: string;
  app_id?: App | null;
  error_source?: 'BACKEND_API' | 'CLIENT_APP';
  endpoint?: string;
  http_method?: string;
  status_code?: number;
  request_payload?: any;
  request_query?: any;
  request_headers?: any;
  response_body?: any;
  ip_address?: string;
  user_agent?: string;
  error_title: string;
  error_message: string;
  stack_trace: string;
  file_name: string;
  line_number: number;
  os_type?: string;
  os_version?: string;
  device_model?: string;
  app_version?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REOPENED';
  occurrences_count: number;
  first_seen_at: string;
  last_seen_at: string;
  resolved_at?: string;
  resolved_by?: { name: string; email: string };
}

export interface NotificationCampaign {
  _id: string;
  app_id?: App;
  group_id?: Group;
  title: string;
  message: string;
  image_url?: string;
  notification_type: 'SELF' | 'CROSS';
  target_audience: string;
  target_country: string;
  target_local_time: string;
  status: 'DRAFT' | 'SCHEDULED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  total_sent: number;
  total_failed: number;
  created_at: string;
}

export interface CrossMarketingCampaign {
  _id: string;
  title: string;
  source_app_id?: App;
  target_group_id?: Group;
  destination_app_id: App;
  poster_image_url: string;
  custom_message?: string;
  target_button_text: string;
  destination_store_url?: string;
  impressions_count: number;
  clicks_count: number;
  ctr_percent?: number;
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRED';
  created_at: string;
}

export interface FeedbackItem {
  _id: string;
  app_id: App;
  user_id?: { device_id: string; country: string };
  rating: number;
  feedback_text: string;
  user_email?: string;
  app_version?: string;
  device_info?: string;
  status: 'NEW' | 'REVIEWED' | 'ARCHIVED';
  created_at: string;
}

// Runtime object exports so any value import from types.ts never fails
export const App = {};
export const Group = {};
export const DashboardOverview = {};
export const RevenueTrendItem = {};
export const AppRevenueItem = {};
export const CancellationStats = {};
export const CrashLog = {};
export const NotificationCampaign = {};
export const CrossMarketingCampaign = {};
export const FeedbackItem = {};
