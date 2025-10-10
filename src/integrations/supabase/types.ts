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
  public: {
    Tables: {
      archetypes: {
        Row: {
          color_hex: string
          common_misunderstanding: string | null
          created_at: string | null
          daily_practice: string | null
          element: string
          emoji: string
          essence: string
          expanded_meaning: string
          family: string
          frequency_tone: string
          id: string
          keywords: string[]
          light_expression: string[]
          modes: string[]
          number: number
          primary_label: string
          root: number
          secondary_label: string | null
          shadow_expression: string[]
          tertiary_label: string | null
          tone_style: string
          ui_motif: string
          updated_at: string | null
        }
        Insert: {
          color_hex: string
          common_misunderstanding?: string | null
          created_at?: string | null
          daily_practice?: string | null
          element: string
          emoji: string
          essence: string
          expanded_meaning: string
          family: string
          frequency_tone: string
          id: string
          keywords: string[]
          light_expression: string[]
          modes: string[]
          number: number
          primary_label: string
          root: number
          secondary_label?: string | null
          shadow_expression: string[]
          tertiary_label?: string | null
          tone_style: string
          ui_motif: string
          updated_at?: string | null
        }
        Update: {
          color_hex?: string
          common_misunderstanding?: string | null
          created_at?: string | null
          daily_practice?: string | null
          element?: string
          emoji?: string
          essence?: string
          expanded_meaning?: string
          family?: string
          frequency_tone?: string
          id?: string
          keywords?: string[]
          light_expression?: string[]
          modes?: string[]
          number?: number
          primary_label?: string
          root?: number
          secondary_label?: string | null
          shadow_expression?: string[]
          tertiary_label?: string | null
          tone_style?: string
          ui_motif?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      evolution_paths: {
        Row: {
          created_at: string | null
          description: string
          from_number: number
          id: string
          path_type: string
          to_number: number
        }
        Insert: {
          created_at?: string | null
          description: string
          from_number: number
          id?: string
          path_type: string
          to_number: number
        }
        Update: {
          created_at?: string | null
          description?: string
          from_number?: number
          id?: string
          path_type?: string
          to_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "evolution_paths_from_number_fkey"
            columns: ["from_number"]
            isOneToOne: false
            referencedRelation: "archetypes"
            referencedColumns: ["number"]
          },
          {
            foreignKeyName: "evolution_paths_to_number_fkey"
            columns: ["to_number"]
            isOneToOne: false
            referencedRelation: "archetypes"
            referencedColumns: ["number"]
          },
        ]
      }
      keystone_actions: {
        Row: {
          action: string
          archetype_number: number
          category: string | null
          created_at: string | null
          id: string
          xp_value: number
        }
        Insert: {
          action: string
          archetype_number: number
          category?: string | null
          created_at?: string | null
          id?: string
          xp_value?: number
        }
        Update: {
          action?: string
          archetype_number?: number
          category?: string | null
          created_at?: string | null
          id?: string
          xp_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "keystone_actions_archetype_number_fkey"
            columns: ["archetype_number"]
            isOneToOne: false
            referencedRelation: "archetypes"
            referencedColumns: ["number"]
          },
        ]
      }
      readings: {
        Row: {
          chakra_data: Json
          context: string | null
          created_at: string | null
          id: string
          image_url: string | null
          input_text: string
          normalized_number: string
          numerology_data: Json
          tags: string[] | null
          user_id: string | null
        }
        Insert: {
          chakra_data: Json
          context?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          input_text: string
          normalized_number: string
          numerology_data: Json
          tags?: string[] | null
          user_id?: string | null
        }
        Update: {
          chakra_data?: Json
          context?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          input_text?: string
          normalized_number?: string
          numerology_data?: Json
          tags?: string[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_actions_log: {
        Row: {
          action_description: string
          action_id: string | null
          archetype_number: number
          id: string
          performed_at: string | null
          user_id: string
          xp_earned: number
        }
        Insert: {
          action_description: string
          action_id?: string | null
          archetype_number: number
          id?: string
          performed_at?: string | null
          user_id: string
          xp_earned?: number
        }
        Update: {
          action_description?: string
          action_id?: string | null
          archetype_number?: number
          id?: string
          performed_at?: string | null
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_actions_log_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "keystone_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_actions_log_archetype_number_fkey"
            columns: ["archetype_number"]
            isOneToOne: false
            referencedRelation: "archetypes"
            referencedColumns: ["number"]
          },
        ]
      }
      user_progress: {
        Row: {
          archetype_number: number
          created_at: string | null
          current_level: string
          id: string
          level_up_at: string | null
          total_xp: number
          unlocked_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          archetype_number: number
          created_at?: string | null
          current_level?: string
          id?: string
          level_up_at?: string | null
          total_xp?: number
          unlocked_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          archetype_number?: number
          created_at?: string | null
          current_level?: string
          id?: string
          level_up_at?: string | null
          total_xp?: number
          unlocked_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_archetype_number_fkey"
            columns: ["archetype_number"]
            isOneToOne: false
            referencedRelation: "archetypes"
            referencedColumns: ["number"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
