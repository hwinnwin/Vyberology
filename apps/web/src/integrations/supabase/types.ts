Initialising login role...
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          source: string
          source_transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          source?: string
          source_transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          source?: string
          source_transaction_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          metadata: Json | null
          stripe_customer_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          metadata?: Json | null
          stripe_customer_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          stripe_customer_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          admin_notes: string | null
          app_version: string | null
          browser_info: Json | null
          created_at: string | null
          description: string
          email: string | null
          id: string
          page_url: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["feedback_status"] | null
          title: string
          type: Database["public"]["Enums"]["feedback_type"]
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          app_version?: string | null
          browser_info?: Json | null
          created_at?: string | null
          description: string
          email?: string | null
          id?: string
          page_url?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["feedback_status"] | null
          title: string
          type: Database["public"]["Enums"]["feedback_type"]
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          app_version?: string | null
          browser_info?: Json | null
          created_at?: string | null
          description?: string
          email?: string | null
          id?: string
          page_url?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["feedback_status"] | null
          title?: string
          type?: Database["public"]["Enums"]["feedback_type"]
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      iap_webhook_events: {
        Row: {
          event_id: string
          event_type: string
          payload: Json | null
          processed_at: string
          user_id: string | null
        }
        Insert: {
          event_id: string
          event_type: string
          payload?: Json | null
          processed_at?: string
          user_id?: string | null
        }
        Update: {
          event_id?: string
          event_type?: string
          payload?: Json | null
          processed_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      lesson_completions: {
        Row: {
          completed_at: string | null
          id: string
          lesson_id: string
          user_id: string
          volume: number
        }
        Insert: {
          completed_at?: string | null
          id?: string
          lesson_id: string
          user_id: string
          volume: number
        }
        Update: {
          completed_at?: string | null
          id?: string
          lesson_id?: string
          user_id?: string
          volume?: number
        }
        Relationships: []
      }
      lumyn_claims: {
        Row: {
          confidence: number
          created_at: string | null
          data: Json
          evidence_count: number
          id: string
          key: string
          source_conversation_id: string | null
          status: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence?: number
          created_at?: string | null
          data?: Json
          evidence_count?: number
          id?: string
          key: string
          source_conversation_id?: string | null
          status?: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence?: number
          created_at?: string | null
          data?: Json
          evidence_count?: number
          id?: string
          key?: string
          source_conversation_id?: string | null
          status?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lumyn_claims_source_conversation_id_fkey"
            columns: ["source_conversation_id"]
            isOneToOne: false
            referencedRelation: "lumyn_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      lumyn_conversations: {
        Row: {
          created_at: string | null
          ended_at: string | null
          id: string
          metadata: Json | null
          mode: string
          session_summary: string | null
          status: string
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          mode?: string
          session_summary?: string | null
          status?: string
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          mode?: string
          session_summary?: string | null
          status?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lumyn_evidence: {
        Row: {
          claim_id: string
          created_at: string | null
          evidence_kind: string
          id: string
          source_msg_id: string | null
          strength: number | null
          summary: string | null
          user_id: string
        }
        Insert: {
          claim_id: string
          created_at?: string | null
          evidence_kind: string
          id?: string
          source_msg_id?: string | null
          strength?: number | null
          summary?: string | null
          user_id: string
        }
        Update: {
          claim_id?: string
          created_at?: string | null
          evidence_kind?: string
          id?: string
          source_msg_id?: string | null
          strength?: number | null
          summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lumyn_evidence_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "lumyn_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lumyn_evidence_source_msg_id_fkey"
            columns: ["source_msg_id"]
            isOneToOne: false
            referencedRelation: "lumyn_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      lumyn_guiding_principles: {
        Row: {
          active: boolean
          created_at: string | null
          id: string
          principle: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string | null
          id?: string
          principle: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string | null
          id?: string
          principle?: string
          user_id?: string
        }
        Relationships: []
      }
      lumyn_memory_ops: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          message_id: string | null
          op_type: string
          reason: string | null
          target_claim_id: string | null
          target_desc: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          message_id?: string | null
          op_type: string
          reason?: string | null
          target_claim_id?: string | null
          target_desc?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          message_id?: string | null
          op_type?: string
          reason?: string | null
          target_claim_id?: string | null
          target_desc?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lumyn_memory_ops_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "lumyn_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lumyn_memory_ops_target_claim_id_fkey"
            columns: ["target_claim_id"]
            isOneToOne: false
            referencedRelation: "lumyn_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      lumyn_messages: {
        Row: {
          arousal: number | null
          classification: Json | null
          confidence: number | null
          content: string
          conversation_id: string
          created_at: string | null
          domain: string | null
          emotion: string | null
          id: string
          intent: string | null
          latency_ms: number | null
          model_name: string | null
          model_provider: string | null
          moment_confidence: number | null
          moment_type: string | null
          prompt_version: string | null
          risk_level: string | null
          role: string
          tokens_in: number | null
          tokens_out: number | null
          user_id: string
        }
        Insert: {
          arousal?: number | null
          classification?: Json | null
          confidence?: number | null
          content: string
          conversation_id: string
          created_at?: string | null
          domain?: string | null
          emotion?: string | null
          id?: string
          intent?: string | null
          latency_ms?: number | null
          model_name?: string | null
          model_provider?: string | null
          moment_confidence?: number | null
          moment_type?: string | null
          prompt_version?: string | null
          risk_level?: string | null
          role: string
          tokens_in?: number | null
          tokens_out?: number | null
          user_id: string
        }
        Update: {
          arousal?: number | null
          classification?: Json | null
          confidence?: number | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          domain?: string | null
          emotion?: string | null
          id?: string
          intent?: string | null
          latency_ms?: number | null
          model_name?: string | null
          model_provider?: string | null
          moment_confidence?: number | null
          moment_type?: string | null
          prompt_version?: string | null
          risk_level?: string | null
          role?: string
          tokens_in?: number | null
          tokens_out?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lumyn_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "lumyn_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      lumyn_patterns: {
        Row: {
          action_taken: string | null
          confidence: number | null
          created_at: string | null
          domain: string
          emotional_sig: Json | null
          id: string
          outcome: string | null
          source_msg_id: string | null
          user_id: string
          user_reflection: string | null
        }
        Insert: {
          action_taken?: string | null
          confidence?: number | null
          created_at?: string | null
          domain: string
          emotional_sig?: Json | null
          id?: string
          outcome?: string | null
          source_msg_id?: string | null
          user_id: string
          user_reflection?: string | null
        }
        Update: {
          action_taken?: string | null
          confidence?: number | null
          created_at?: string | null
          domain?: string
          emotional_sig?: Json | null
          id?: string
          outcome?: string | null
          source_msg_id?: string | null
          user_id?: string
          user_reflection?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lumyn_patterns_source_msg_id_fkey"
            columns: ["source_msg_id"]
            isOneToOne: false
            referencedRelation: "lumyn_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      lumyn_rate_limits: {
        Row: {
          count_day: number
          count_hour: number
          id: string
          updated_at: string | null
          user_id: string
          window_day: string
          window_hour: string
        }
        Insert: {
          count_day?: number
          count_hour?: number
          id?: string
          updated_at?: string | null
          user_id: string
          window_day: string
          window_hour: string
        }
        Update: {
          count_day?: number
          count_hour?: number
          id?: string
          updated_at?: string | null
          user_id?: string
          window_day?: string
          window_hour?: string
        }
        Relationships: []
      }
      lumyn_safety_events: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          message_id: string | null
          trigger_source: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          message_id?: string | null
          trigger_source?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          message_id?: string | null
          trigger_source?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lumyn_safety_events_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "lumyn_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      lumyn_user_models: {
        Row: {
          adaptive_stage: number
          comm_style: string | null
          created_at: string | null
          interaction_count: number
          preferred_tone: string | null
          snapshot: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          adaptive_stage?: number
          comm_style?: string | null
          created_at?: string | null
          interaction_count?: number
          preferred_tone?: string | null
          snapshot?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          adaptive_stage?: number
          comm_style?: string | null
          created_at?: string | null
          interaction_count?: number
          preferred_tone?: string | null
          snapshot?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      prices: {
        Row: {
          active: boolean | null
          created_at: string | null
          currency: string
          id: string
          interval: string | null
          interval_count: number | null
          metadata: Json | null
          product_id: string | null
          stripe_price_id: string
          trial_period_days: number | null
          unit_amount: number
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          currency?: string
          id?: string
          interval?: string | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          stripe_price_id: string
          trial_period_days?: number | null
          unit_amount: number
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          currency?: string
          id?: string
          interval?: string | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          stripe_price_id?: string
          trial_period_days?: number | null
          unit_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          name: string
          stripe_product_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          stripe_product_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          stripe_product_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          id: string
          metadata: Json | null
          platform: string
          platform_transaction_id: string | null
          price_id: string | null
          product_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          id?: string
          metadata?: Json | null
          platform?: string
          platform_transaction_id?: string | null
          price_id?: string | null
          product_id?: string | null
          status: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          metadata?: Json | null
          platform?: string
          platform_transaction_id?: string | null
          price_id?: string | null
          product_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_credits: {
        Row: {
          created_at: string | null
          credits: number
          id: string
          last_credit_purchase: string | null
          total_purchased: number
          total_used: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          credits?: number
          id?: string
          last_credit_purchase?: string | null
          total_purchased?: number
          total_used?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          credits?: number
          id?: string
          last_credit_purchase?: string | null
          total_purchased?: number
          total_used?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      reading_numbers: {
        Row: {
          confidence: number | null
          created_at: string
          id: string
          meta_json: Json | null
          normalized_numbers: number[]
          raw: string
          reading_id: string
          source: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          id?: string
          meta_json?: Json | null
          normalized_numbers?: number[]
          raw: string
          reading_id: string
          source: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          id?: string
          meta_json?: Json | null
          normalized_numbers?: number[]
          raw?: string
          reading_id?: string
          source?: string
        }
        Relationships: []
      }
      reading_outputs: {
        Row: {
          chakra_tags: Json
          created_at: string
          elemental_tags: Json
          frequency_score_json: Json | null
          markdown: string | null
          numbers_summary: Json
          numerology_json: Json
          reading_id: string
          volume_iv_render: Json
        }
        Insert: {
          chakra_tags?: Json
          created_at?: string
          elemental_tags?: Json
          frequency_score_json?: Json | null
          markdown?: string | null
          numbers_summary?: Json
          numerology_json?: Json
          reading_id: string
          volume_iv_render?: Json
        }
        Update: {
          chakra_tags?: Json
          created_at?: string
          elemental_tags?: Json
          frequency_score_json?: Json | null
          markdown?: string | null
          numbers_summary?: Json
          numerology_json?: Json
          reading_id?: string
          volume_iv_render?: Json
        }
        Relationships: []
      }
      readings: {
        Row: {
          created_at: string | null
          dob: string
          full_name: string
          id: string
          numerology_numbers: Json
          purchase_id: string | null
          reading_data: Json | null
          reading_text: string | null
          semantics: Json | null
          share_slug: string | null
          tier: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dob: string
          full_name: string
          id?: string
          numerology_numbers?: Json
          purchase_id?: string | null
          reading_data?: Json | null
          reading_text?: string | null
          semantics?: Json | null
          share_slug?: string | null
          tier: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dob?: string
          full_name?: string
          id?: string
          numerology_numbers?: Json
          purchase_id?: string | null
          reading_data?: Json | null
          reading_text?: string | null
          semantics?: Json | null
          share_slug?: string | null
          tier?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "readings_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      share_tokens: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          reading_id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          reading_id: string
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          reading_id?: string
          token?: string
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          event_id: string
          event_type: string
          processed_at: string
          user_id: string | null
        }
        Insert: {
          event_id: string
          event_type: string
          processed_at?: string
          user_id?: string | null
        }
        Update: {
          event_id?: string
          event_type?: string
          processed_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          ended_at: string | null
          id: string
          metadata: Json | null
          price_id: string | null
          quantity: number | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_key: string
          id: string
          progress: number | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_key: string
          id?: string
          progress?: number | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_key?: string
          id?: string
          progress?: number | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          birth_day: number | null
          birth_hour: number | null
          birth_month: number | null
          birth_year: number | null
          created_at: string
          current_streak: number | null
          display_name: string | null
          enable_ai_synthesis: boolean | null
          id: string
          last_reading_at: string | null
          longest_streak: number | null
          preferred_locale: string | null
          preferred_volume: number | null
          show_lunar_calendar: boolean | null
          show_vietnamese_astrology: boolean | null
          theme: string | null
          total_readings: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          birth_day?: number | null
          birth_hour?: number | null
          birth_month?: number | null
          birth_year?: number | null
          created_at?: string
          current_streak?: number | null
          display_name?: string | null
          enable_ai_synthesis?: boolean | null
          id?: string
          last_reading_at?: string | null
          longest_streak?: number | null
          preferred_locale?: string | null
          preferred_volume?: number | null
          show_lunar_calendar?: boolean | null
          show_vietnamese_astrology?: boolean | null
          theme?: string | null
          total_readings?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          birth_day?: number | null
          birth_hour?: number | null
          birth_month?: number | null
          birth_year?: number | null
          created_at?: string
          current_streak?: number | null
          display_name?: string | null
          enable_ai_synthesis?: boolean | null
          id?: string
          last_reading_at?: string | null
          longest_streak?: number | null
          preferred_locale?: string | null
          preferred_volume?: number | null
          show_lunar_calendar?: boolean | null
          show_vietnamese_astrology?: boolean | null
          theme?: string | null
          total_readings?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      volume_progress: {
        Row: {
          completed_at: string | null
          id: string
          lessons_completed: number | null
          readings_created: number | null
          started_at: string | null
          total_lessons: number
          user_id: string
          volume: number
        }
        Insert: {
          completed_at?: string | null
          id?: string
          lessons_completed?: number | null
          readings_created?: number | null
          started_at?: string | null
          total_lessons: number
          user_id: string
          volume: number
        }
        Update: {
          completed_at?: string | null
          id?: string
          lessons_completed?: number | null
          readings_created?: number | null
          started_at?: string | null
          total_lessons?: number
          user_id?: string
          volume?: number
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_reading_credits: {
        Args: { p_credits: number; p_purchase_id?: string; p_user_id: string }
        Returns: undefined
      }
      generate_share_token: {
        Args: { p_expires_in_days?: number; p_reading_id: string }
        Returns: string
      }
      get_feedback_stats: {
        Args: never
        Returns: {
          bugs: number
          completed_items: number
          features: number
          improvements: number
          in_progress_items: number
          new_items: number
          total_feedback: number
        }[]
      }
      get_or_create_user_profile: {
        Args: { p_user_id: string }
        Returns: {
          avatar_url: string | null
          birth_day: number | null
          birth_hour: number | null
          birth_month: number | null
          birth_year: number | null
          created_at: string
          current_streak: number | null
          display_name: string | null
          enable_ai_synthesis: boolean | null
          id: string
          last_reading_at: string | null
          longest_streak: number | null
          preferred_locale: string | null
          preferred_volume: number | null
          show_lunar_calendar: boolean | null
          show_vietnamese_astrology: boolean | null
          theme: string | null
          total_readings: number | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_reading_by_share_token: {
        Args: { p_token: string }
        Returns: {
          chakra_data: Json
          context: string
          created_at: string
          image_url: string
          input_text: string
          normalized_number: string
          numerology_data: Json
          reading_id: string
          reading_numbers: Json
          reading_output: Json
          source_image_url: string
          source_type: string
          tags: string[]
          user_id: string
        }[]
      }
      get_reading_by_slug: {
        Args: { p_slug: string }
        Returns: {
          created_at: string | null
          dob: string
          full_name: string
          id: string
          numerology_numbers: Json
          purchase_id: string | null
          reading_data: Json | null
          reading_text: string | null
          semantics: Json | null
          share_slug: string | null
          tier: string
          updated_at: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "readings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_credits: { Args: { p_user_id: string }; Returns: number }
      increment_lesson_count: {
        Args: { p_user_id: string; p_volume: number }
        Returns: undefined
      }
      increment_reading_count: {
        Args: { p_user_id: string; p_volume: number }
        Returns: undefined
      }
      refund_reading_credit: { Args: { p_user_id: string }; Returns: undefined }
      revoke_share_token: { Args: { p_token: string }; Returns: boolean }
      save_reading: {
        Args: {
          p_dob?: string
          p_full_name?: string
          p_numerology_numbers?: Json
          p_purchase_id?: string
          p_reading_data?: Json
          p_reading_text?: string
          p_semantics?: Json
          p_tier?: string
          p_user_id: string
        }
        Returns: Json
      }
      update_user_streak: { Args: { p_user_id: string }; Returns: undefined }
      use_reading_credit: { Args: { p_user_id: string }; Returns: boolean }
    }
    Enums: {
      feedback_status:
        | "new"
        | "in_progress"
        | "completed"
        | "wont_fix"
        | "duplicate"
      feedback_type: "bug" | "feature" | "improvement" | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      delete_leaf_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_level: { Args: { name: string }; Returns: number }
      get_prefix: { Args: { name: string }; Returns: string }
      get_prefixes: { Args: { name: string }; Returns: string[] }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_legacy_v1: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      feedback_status: [
        "new",
        "in_progress",
        "completed",
        "wont_fix",
        "duplicate",
      ],
      feedback_type: ["bug", "feature", "improvement", "other"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
A new version of Supabase CLI is available: v2.78.1 (currently installed v2.54.11)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
