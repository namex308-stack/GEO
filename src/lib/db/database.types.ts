/**
 * Generated-style database row types for ConvAudit.
 * Source of truth: supabase/migrations/20260728140000_audit_engine_schema.sql
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      plan_catalog: {
        Row: {
          id: "free" | "pro" | "business";
          display_name: string;
          audits_per_month: number | null;
          ai_gens_per_month: number | null;
          stores_limit: number | null;
          features: Json;
          created_at: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          locale: string | null;
          timezone: string | null;
          business_name: string | null;
          store_url: string | null;
          country: string | null;
          primary_language: string | null;
          platform: string | null;
          store_size: string | null;
          business_category: string | null;
          primary_goal: string | null;
          monthly_traffic: string | null;
          monthly_orders: string | null;
          main_challenge: string | null;
          competitor_url: string | null;
          store_domain: string | null;
          homepage_title: string | null;
          platform_confidence: number | null;
          store_verified_at: string | null;
          onboarding_step: number;
          onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string | null;
          plan_id: "free" | "pro" | "business";
          created_at: string;
          updated_at: string;
        };
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: "owner" | "admin" | "member" | "viewer";
          created_at: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          workspace_id: string;
          plan_id: string;
          status: string;
          billing_period: "monthly" | "yearly" | null;
          kashier_subscription_id: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      billing_events: {
        Row: {
          id: string;
          workspace_id: string | null;
          provider: string;
          event_type: string;
          external_id: string | null;
          payload: Json;
          processed_at: string | null;
          created_at: string;
        };
      };
      stores: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          primary_url: string;
          platform: string | null;
          is_primary: boolean;
          country: string | null;
          language: string | null;
          currency: string | null;
          detected_theme: string | null;
          verified_at: string | null;
          last_crawled_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      analysis_categories: {
        Row: {
          id: string;
          slug: string;
          display_name: string;
          description: string | null;
          created_at: string;
        };
      };
      audits: {
        Row: {
          id: string;
          workspace_id: string;
          store_id: string | null;
          created_by: string | null;
          status: string;
          product_url: string;
          store_url: string | null;
          competitor_url: string | null;
          product_name: string | null;
          store_name: string | null;
          overall_score: number | null;
          competitor_score: number | null;
          geo_score: number | null;
          crawl_provider: string | null;
          crawl_duration_ms: number | null;
          analysis_version: string | null;
          error_message: string | null;
          model: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
      };
      audit_pages: {
        Row: {
          id: string;
          audit_id: string;
          role: "primary" | "competitor";
          url: string;
          page_type: string;
          title: string | null;
          description: string | null;
          image_count: number | null;
          scrape_status: string;
          scrape_ms: number | null;
          content_hash: string | null;
          structured_data: Json;
          normalized_markdown: string | null;
          created_at: string;
        };
      };
      audit_scores: {
        Row: {
          id: string;
          audit_id: string;
          category_id: string;
          subject: "self" | "competitor";
          score: number;
          max_score: number;
          label: string | null;
          summary: string | null;
        };
      };
      recommendations: {
        Row: {
          id: string;
          audit_id: string;
          category_id: string | null;
          external_key: string | null;
          pillar: string | null;
          severity: string;
          impact: string;
          effort: string | null;
          problem: string;
          solution: string;
          confidence: number | null;
          affected_page: string | null;
          projected_impact: string | null;
          before_preview: string | null;
          after_preview: string | null;
          estimated_lift: string | null;
          source: string;
          fix_type: string;
          sort_order: number;
          status: string;
          created_at: string;
        };
      };
      geo_signals: {
        Row: {
          audit_id: string;
          chatgpt: number | null;
          perplexity: number | null;
          google_ai: number | null;
          citation_score: number | null;
          faq_score: number | null;
          schema_score: number | null;
          entity_score: number | null;
          ai_readability_score: number | null;
          freshness_score: number | null;
        };
      };
      reports: {
        Row: {
          id: string;
          audit_id: string;
          workspace_id: string;
          version: number;
          summary: Json;
          overall_score: number | null;
          geo_score: number | null;
          seo_score: number | null;
          conversion_score: number | null;
          trust_score: number | null;
          rendered_at: string;
          created_at: string;
        };
      };
      ai_generations: {
        Row: {
          id: string;
          workspace_id: string;
          audit_id: string | null;
          created_by: string | null;
          product_url: string | null;
          payload: Json;
          model: string | null;
          generation_type: string | null;
          status: string | null;
          tokens_used: number | null;
          duration_ms: number | null;
          created_at: string;
        };
      };
      analysis_runs: {
        Row: {
          id: string;
          audit_id: string;
          analyzer: string;
          status: string;
          started_at: string | null;
          finished_at: string | null;
          duration_ms: number | null;
          tokens_used: number | null;
          estimated_cost: number | null;
          error_message: string | null;
          created_at: string;
        };
      };
      usage_events: {
        Row: {
          id: string;
          workspace_id: string;
          metric: string;
          quantity: number;
          ref_type: string | null;
          ref_id: string | null;
          created_at: string;
        };
      };
    };
  };
}
