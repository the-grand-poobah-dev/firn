export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.18" };
  public: {
    Tables: {
      accruals: { Row: { accrual_date: string; amount: number; balance_after: number; position_id: string }; Insert: { accrual_date: string; amount: number; balance_after: number; position_id: string }; Update: { accrual_date?: string; amount?: number; balance_after?: number; position_id?: string }; Relationships: [] };
      allocations: { Row: { amount: number; position_id: string; property_id: string }; Insert: { amount: number; position_id: string; property_id: string }; Update: { amount?: number; position_id?: string; property_id?: string }; Relationships: [] };
      notifications: { Row: { body: string | null; created_at: string | null; id: string; read: boolean | null; title: string; user_id: string }; Insert: { body?: string | null; created_at?: string | null; id?: string; read?: boolean | null; title: string; user_id: string }; Update: { body?: string | null; created_at?: string | null; id?: string; read?: boolean | null; title?: string; user_id?: string }; Relationships: [] };
      plans: { Row: { code: Database["public"]["Enums"]["plan_code"]; high_apy: number; lock_months: number; low_apy: number; min_amount: number; name: string; target_apy: number }; Insert: { code: Database["public"]["Enums"]["plan_code"]; high_apy: number; lock_months: number; low_apy: number; min_amount?: number; name: string; target_apy: number }; Update: { code?: Database["public"]["Enums"]["plan_code"]; high_apy?: number; lock_months?: number; low_apy?: number; min_amount?: number; name?: string; target_apy?: number }; Relationships: [] };
      positions: { Row: { apy: number; auto_roll: string; created_at: string | null; id: string; matures_on: string; plan: Database["public"]["Enums"]["plan_code"]; principal: number; settled: boolean; started_on: string; status: string; user_id: string }; Insert: { apy: number; auto_roll?: string; created_at?: string | null; id?: string; matures_on: string; plan: Database["public"]["Enums"]["plan_code"]; principal: number; settled?: boolean; started_on?: string; status?: string; user_id: string }; Update: { apy?: number; auto_roll?: string; created_at?: string | null; id?: string; matures_on?: string; plan?: Database["public"]["Enums"]["plan_code"]; principal?: number; settled?: boolean; started_on?: string; status?: string; user_id?: string }; Relationships: [] };
      profiles: { Row: { country: string | null; created_at: string | null; currency: string; full_name: string | null; goals: string[] | null; id: string; kyc_status: string; lock_pref: string | null; prefs: Json; referral_code: string | null; risk_level: number | null }; Insert: { country?: string | null; created_at?: string | null; currency?: string; full_name?: string | null; goals?: string[] | null; id: string; kyc_status?: string; lock_pref?: string | null; prefs?: Json; referral_code?: string | null; risk_level?: number | null }; Update: { country?: string | null; created_at?: string | null; currency?: string; full_name?: string | null; goals?: string[] | null; id?: string; kyc_status?: string; lock_pref?: string | null; prefs?: Json; referral_code?: string | null; risk_level?: number | null }; Relationships: [] };
      properties: { Row: { about: string | null; art: string; city: string; country: string; documents: Json; id: string; is_active: boolean | null; kind: string; lat: number | null; lng: number | null; name: string; occupancy: number; raised: number; rent_history: Json; slug: string; sort: number | null; target_raise: number; target_return: number; units: number; valuation: number; valuation_history: Json }; Insert: { about?: string | null; art: string; city: string; country: string; documents?: Json; id?: string; is_active?: boolean | null; kind: string; lat?: number | null; lng?: number | null; name: string; occupancy: number; raised?: number; rent_history?: Json; slug: string; sort?: number | null; target_raise: number; target_return: number; units: number; valuation: number; valuation_history?: Json }; Update: { about?: string | null; art?: string; city?: string; country?: string; documents?: Json; id?: string; is_active?: boolean | null; kind?: string; lat?: number | null; lng?: number | null; name?: string; occupancy?: number; raised?: number; rent_history?: Json; slug?: string; sort?: number | null; target_raise?: number; target_return?: number; units?: number; valuation?: number; valuation_history?: Json }; Relationships: [] };
      property_updates: { Row: { body: string | null; id: string; posted_on: string | null; property_id: string | null; title: string }; Insert: { body?: string | null; id?: string; posted_on?: string | null; property_id?: string | null; title: string }; Update: { body?: string | null; id?: string; posted_on?: string | null; property_id?: string | null; title?: string }; Relationships: [] };
      wallet_ledger: { Row: { amount: number; created_at: string | null; id: string; kind: string; method: string | null; user_id: string }; Insert: { amount: number; created_at?: string | null; id?: string; kind: string; method?: string | null; user_id: string }; Update: { amount?: number; created_at?: string | null; id?: string; kind?: string; method?: string | null; user_id?: string }; Relationships: [] };
    };
    Views: {
      portfolio_daily: { Row: { accrual_date: string | null; balance: number | null; profit: number | null; user_id: string | null }; Relationships: [] };
      positions_live: { Row: { apy: number | null; auto_roll: string | null; created_at: string | null; days_in: number | null; days_left: number | null; earned: number | null; id: string | null; matures_on: string | null; plan: Database["public"]["Enums"]["plan_code"] | null; principal: number | null; settled: boolean | null; started_on: string | null; status: string | null; user_id: string | null; value: number | null }; Relationships: [] };
    };
    Functions: {
      accrue_daily: { Args: never; Returns: undefined };
      create_position: { Args: { p_amount: number; p_plan: Database["public"]["Enums"]["plan_code"] }; Returns: string };
      deposit_demo: { Args: { p_amount: number; p_method: string }; Returns: number };
      early_exit: { Args: { p_position: string }; Returns: number };
      wallet_balance: { Args: never; Returns: number };
      property_investor_count: { Args: { p_property: string }; Returns: number };
      withdraw_demo: { Args: { p_amount: number }; Returns: number };
    };
    Enums: { plan_code: "six" | "twelve" };
    CompositeTypes: { [_ in never]: never };
  };
};
type PublicSchema = Database["public"];
export type Tables<T extends keyof PublicSchema["Tables"] | keyof PublicSchema["Views"]> =
  T extends keyof PublicSchema["Tables"] ? PublicSchema["Tables"][T]["Row"] :
  T extends keyof PublicSchema["Views"] ? PublicSchema["Views"][T]["Row"] : never;
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
