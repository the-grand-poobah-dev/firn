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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      accruals: {
        Row: {
          accrual_date: string
          amount: number
          balance_after: number
          position_id: string
        }
        Insert: {
          accrual_date: string
          amount: number
          balance_after: number
          position_id: string
        }
        Update: {
          accrual_date?: string
          amount?: number
          balance_after?: number
          position_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accruals_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accruals_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions_live"
            referencedColumns: ["id"]
          },
        ]
      }
      allocations: {
        Row: {
          amount: number
          position_id: string
          property_id: string
        }
        Insert: {
          amount: number
          position_id: string
          property_id: string
        }
        Update: {
          amount?: number
          position_id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "allocations_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allocations_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions_live"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allocations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      deposit_rate_limits: {
        Row: {
          attempted_at: string
          user_id: string
        }
        Insert: {
          attempted_at?: string
          user_id: string
        }
        Update: {
          attempted_at?: string
          user_id?: string
        }
        Relationships: []
      }
      deposit_review_events: {
        Row: {
          action: string
          actor_id: string
          approved_amount: number | null
          created_at: string
          deposit_id: string
          id: string
          reason: string | null
        }
        Insert: {
          action: string
          actor_id: string
          approved_amount?: number | null
          created_at?: string
          deposit_id: string
          id?: string
          reason?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          approved_amount?: number | null
          created_at?: string
          deposit_id?: string
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deposit_review_events_deposit_id_fkey"
            columns: ["deposit_id"]
            isOneToOne: false
            referencedRelation: "deposits"
            referencedColumns: ["id"]
          },
        ]
      }
      deposits: {
        Row: {
          block_timestamp: string | null
          claimed_amount: number
          confirmations: number
          created_at: string
          credited_at: string | null
          expires_at: string
          failure_reason: string | null
          from_address: string | null
          id: string
          method: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          to_address: string
          txid: string
          updated_at: string
          user_id: string
          verified_amount: number | null
        }
        Insert: {
          block_timestamp?: string | null
          claimed_amount: number
          confirmations?: number
          created_at?: string
          credited_at?: string | null
          expires_at?: string
          failure_reason?: string | null
          from_address?: string | null
          id?: string
          method?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          to_address: string
          txid: string
          updated_at?: string
          user_id: string
          verified_amount?: number | null
        }
        Update: {
          block_timestamp?: string | null
          claimed_amount?: number
          confirmations?: number
          created_at?: string
          credited_at?: string | null
          expires_at?: string
          failure_reason?: string | null
          from_address?: string | null
          id?: string
          method?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          to_address?: string
          txid?: string
          updated_at?: string
          user_id?: string
          verified_amount?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          read: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          read?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          read?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          code: Database["public"]["Enums"]["plan_code"]
          high_apy: number
          lock_months: number
          low_apy: number
          min_amount: number
          name: string
          target_apy: number
        }
        Insert: {
          code: Database["public"]["Enums"]["plan_code"]
          high_apy: number
          lock_months: number
          low_apy: number
          min_amount?: number
          name: string
          target_apy: number
        }
        Update: {
          code?: Database["public"]["Enums"]["plan_code"]
          high_apy?: number
          lock_months?: number
          low_apy?: number
          min_amount?: number
          name?: string
          target_apy?: number
        }
        Relationships: []
      }
      position_requests: {
        Row: {
          created_at: string
          idempotency_key: string
          position_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          idempotency_key: string
          position_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          idempotency_key?: string
          position_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "position_requests_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_requests_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions_live"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          apy: number
          auto_roll: string
          created_at: string | null
          id: string
          matures_on: string
          plan: Database["public"]["Enums"]["plan_code"]
          principal: number
          settled: boolean
          started_on: string
          status: string
          user_id: string
        }
        Insert: {
          apy: number
          auto_roll?: string
          created_at?: string | null
          id?: string
          matures_on: string
          plan: Database["public"]["Enums"]["plan_code"]
          principal: number
          settled?: boolean
          started_on?: string
          status?: string
          user_id: string
        }
        Update: {
          apy?: number
          auto_roll?: string
          created_at?: string | null
          id?: string
          matures_on?: string
          plan?: Database["public"]["Enums"]["plan_code"]
          principal?: number
          settled?: boolean
          started_on?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_plan_fkey"
            columns: ["plan"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["code"]
          },
        ]
      }
      profiles: {
        Row: {
          country: string | null
          created_at: string | null
          currency: string
          full_name: string | null
          goals: string[] | null
          id: string
          is_admin: boolean
          kyc_status: string
          lock_pref: string | null
          prefs: Json
          referral_code: string | null
          risk_level: number | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          currency?: string
          full_name?: string | null
          goals?: string[] | null
          id: string
          is_admin?: boolean
          kyc_status?: string
          lock_pref?: string | null
          prefs?: Json
          referral_code?: string | null
          risk_level?: number | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          currency?: string
          full_name?: string | null
          goals?: string[] | null
          id?: string
          is_admin?: boolean
          kyc_status?: string
          lock_pref?: string | null
          prefs?: Json
          referral_code?: string | null
          risk_level?: number | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          about: string | null
          art: string
          city: string
          country: string
          documents: Json
          id: string
          is_active: boolean | null
          kind: string
          lat: number | null
          lng: number | null
          name: string
          occupancy: number
          raised: number
          rent_history: Json
          slug: string
          sort: number | null
          target_raise: number
          target_return: number
          units: number
          valuation: number
          valuation_history: Json
        }
        Insert: {
          about?: string | null
          art: string
          city: string
          country: string
          documents?: Json
          id?: string
          is_active?: boolean | null
          kind: string
          lat?: number | null
          lng?: number | null
          name: string
          occupancy: number
          raised?: number
          rent_history?: Json
          slug: string
          sort?: number | null
          target_raise: number
          target_return: number
          units: number
          valuation: number
          valuation_history?: Json
        }
        Update: {
          about?: string | null
          art?: string
          city?: string
          country?: string
          documents?: Json
          id?: string
          is_active?: boolean | null
          kind?: string
          lat?: number | null
          lng?: number | null
          name?: string
          occupancy?: number
          raised?: number
          rent_history?: Json
          slug?: string
          sort?: number | null
          target_raise?: number
          target_return?: number
          units?: number
          valuation?: number
          valuation_history?: Json
        }
        Relationships: []
      }
      property_updates: {
        Row: {
          body: string | null
          id: string
          posted_on: string | null
          property_id: string | null
          title: string
        }
        Insert: {
          body?: string | null
          id?: string
          posted_on?: string | null
          property_id?: string | null
          title: string
        }
        Update: {
          body?: string | null
          id?: string
          posted_on?: string | null
          property_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_updates_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_ledger: {
        Row: {
          amount: number
          created_at: string | null
          deposit_id: string | null
          id: string
          kind: string
          method: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          deposit_id?: string | null
          id?: string
          kind: string
          method?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          deposit_id?: string | null
          id?: string
          kind?: string
          method?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_ledger_deposit_id_fkey"
            columns: ["deposit_id"]
            isOneToOne: true
            referencedRelation: "deposits"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      portfolio_daily: {
        Row: {
          accrual_date: string | null
          balance: number | null
          profit: number | null
          user_id: string | null
        }
        Relationships: []
      }
      positions_live: {
        Row: {
          apy: number | null
          auto_roll: string | null
          created_at: string | null
          days_in: number | null
          days_left: number | null
          earned: number | null
          id: string | null
          matures_on: string | null
          plan: Database["public"]["Enums"]["plan_code"] | null
          principal: number | null
          settled: boolean | null
          started_on: string | null
          status: string | null
          user_id: string | null
          value: number | null
        }
        Relationships: [
          {
            foreignKeyName: "positions_plan_fkey"
            columns: ["plan"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Functions: {
      accrue_daily: { Args: never; Returns: undefined }
      backfill_accruals: { Args: { p_position: string }; Returns: number }
      confirm_and_credit_deposit: {
        Args: {
          p_block_timestamp: string
          p_confirmations?: number
          p_deposit_id: string
          p_from_address: string
          p_to_address: string
          p_verified_amount: number
        }
        Returns: string
      }
      consume_deposit_rate_limit: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      create_position: {
        Args: {
          p_amount: number
          p_plan: Database["public"]["Enums"]["plan_code"]
        }
        Returns: string
      }
      create_position_idempotent: {
        Args: {
          p_amount: number
          p_key: string
          p_plan: Database["public"]["Enums"]["plan_code"]
        }
        Returns: string
      }
      credit_deposit: { Args: { p_deposit_id: string }; Returns: string }
      deposit_demo: {
        Args: { p_amount: number; p_method: string }
        Returns: number
      }
      early_exit: { Args: { p_position: string }; Returns: number }
      is_firn_admin: { Args: never; Returns: boolean }
      property_investor_count: { Args: { p_property: string }; Returns: number }
      review_deposit: {
        Args: {
          p_action: string
          p_actor_id: string
          p_amount?: number
          p_deposit_id: string
          p_reason?: string
        }
        Returns: string
      }
      wallet_balance: { Args: never; Returns: number }
      withdraw_demo: { Args: { p_amount: number }; Returns: number }
    }
    Enums: {
      plan_code: "six" | "twelve"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      plan_code: ["six", "twelve"],
    },
  },
} as const
