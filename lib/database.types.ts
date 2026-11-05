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
          id: string
          kind: string
          method: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          kind: string
          method?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          kind?: string
          method?: string | null
          user_id?: string
        }
        Relationships: []
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
      create_position: {
        Args: {
          p_amount: number
          p_plan: Database["public"]["Enums"]["plan_code"]
        }
        Returns: string
      }
      deposit_demo: {
        Args: { p_amount: number; p_method: string }
        Returns: number
      }
      early_exit: { Args: { p_position: string }; Returns: number }
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
