export interface Profile {

  id: string;

  name: string | null;

  email: string | null;

  plan: "free" | "pro" | "business";

  kashier_customer_id: string | null;

  onboarding: Record<string, string> | null;

  created_at: string;

  updated_at: string;

}



export interface Audit {

  id: string;

  user_id: string;

  product_url: string;

  store_url: string | null;

  competitor_url: string | null;

  audit_type: "single" | "crawl";

  site_url: string | null;

  status: "queued" | "scraping" | "scoring" | "interpreting" | "complete" | "failed";

  overall_score: number | null;

  competitor_score: number | null;

  breakdown: unknown;

  competitor_breakdown: unknown;

  geo_readability: unknown;

  engine_results: unknown;

  /** Customer eye test payload (also mirrored in engine_results.customerEyeTest). */
  eye_test_result: unknown;

  recommendations: unknown;

  product_name: string | null;

  store_name: string | null;

  parent_audit_id: string | null;

  crawl_progress: CrawlProgress | null;

  crawl_summary: CrawlSummary | null;

  error_message: string | null;

  created_at: string;

  completed_at: string | null;

}



export interface CrawlProgress {

  phase: "discovering" | "crawling" | "analyzing" | "complete" | "failed";

  totalPages: number;

  completedPages: number;

  currentUrl?: string;

  message?: string;

}



export interface CrawlSummary {

  totalPages: number;

  pagesWithIssues: number;

  averageScore: number;

  bestPage: { url: string; title: string; score: number } | null;

  worstPage: { url: string; title: string; score: number } | null;

  pillarAverages: Record<string, number>;

}



export interface CrawledPage {

  id: string;

  audit_id: string;

  user_id: string;

  url: string;

  title: string | null;

  status: "pending" | "analyzing" | "complete" | "failed";

  sort_order: number;

  error_message: string | null;

  created_at: string;

}



export interface PageResult {

  id: string;

  crawled_page_id: string;

  audit_id: string;

  user_id: string;

  overall_score: number;

  breakdown: unknown;

  geo_readability: unknown;

  recommendations: unknown;

  has_issues: boolean;

  created_at: string;

}



export interface MonitoringJob {

  id: string;

  user_id: string;

  site_url: string;

  store_url: string | null;

  product_url: string | null;

  label: string | null;

  enabled: boolean;

  last_run_at: string | null;

  next_run_at: string | null;

  last_audit_id: string | null;

  previous_audit_id: string | null;

  created_at: string;

  updated_at: string;

}



export interface Notification {

  id: string;

  user_id: string;

  monitoring_job_id: string | null;

  audit_id: string | null;

  type: "report" | "alert" | "issue";

  subject: string;

  body: string;

  status: "pending" | "sent" | "failed";

  error_message: string | null;

  sent_at: string | null;

  created_at: string;

}



export interface GeneratedContent {

  id: string;

  audit_id: string;

  user_id: string;

  content: Record<string, unknown>;

  created_at: string;

}



export interface AiGeneration {

  id: string;

  user_id: string;

  original_text: string;

  improved_text: string;

  generation_type: "title" | "description";

  created_at: string;

}



export interface Subscription {

  id: string;

  user_id: string;

  plan_id: string;

  status: "active" | "cancelled" | "past_due" | "trialing";

  billing_period: "monthly" | "yearly" | null;

  kashier_subscription_id: string | null;

  current_period_start: string | null;

  current_period_end: string | null;

  created_at: string;

}



export interface UsageCounter {

  user_id: string;

  month: string;

  audits_used: number;

  generations_used: number;

}

