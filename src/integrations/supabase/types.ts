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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      booking_availability: {
        Row: {
          created_at: string
          date: string
          is_blocked: boolean
          max_slots: number
          reason: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          is_blocked?: boolean
          max_slots?: number
          reason?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          is_blocked?: boolean
          max_slots?: number
          reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      booking_requests: {
        Row: {
          address: string | null
          created_at: string
          discounted_price: number | null
          email: string | null
          floor_unit: string | null
          group_project_id: string | null
          house_type: string | null
          id: string
          inspection_type: string
          line_display_name: string | null
          line_user_id: string | null
          name: string | null
          needs_reinspection: boolean
          notes: string | null
          original_price: number | null
          phone: string | null
          ping: number | null
          preferred_date: string
          price: number | null
          project_name: string | null
          project_region: string | null
          property_type: string
          region: string
          source: string
          status: string
          time_slot: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          discounted_price?: number | null
          email?: string | null
          floor_unit?: string | null
          group_project_id?: string | null
          house_type?: string | null
          id?: string
          inspection_type: string
          line_display_name?: string | null
          line_user_id?: string | null
          name?: string | null
          needs_reinspection?: boolean
          notes?: string | null
          original_price?: number | null
          phone?: string | null
          ping?: number | null
          preferred_date: string
          price?: number | null
          project_name?: string | null
          project_region?: string | null
          property_type: string
          region: string
          source?: string
          status?: string
          time_slot?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          discounted_price?: number | null
          email?: string | null
          floor_unit?: string | null
          group_project_id?: string | null
          house_type?: string | null
          id?: string
          inspection_type?: string
          line_display_name?: string | null
          line_user_id?: string | null
          name?: string | null
          needs_reinspection?: boolean
          notes?: string | null
          original_price?: number | null
          phone?: string | null
          ping?: number | null
          preferred_date?: string
          price?: number | null
          project_name?: string | null
          project_region?: string | null
          property_type?: string
          region?: string
          source?: string
          status?: string
          time_slot?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_group_project_id_fkey"
            columns: ["group_project_id"]
            isOneToOne: false
            referencedRelation: "group_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      group_projects: {
        Row: {
          cover_image_url: string | null
          created_at: string
          discount_rate: number
          id: string
          min_units: number
          name: string
          proposer_name: string | null
          proposer_phone: string | null
          region: string
          slug: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          discount_rate?: number
          id?: string
          min_units?: number
          name: string
          proposer_name?: string | null
          proposer_phone?: string | null
          region: string
          slug?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          discount_rate?: number
          id?: string
          min_units?: number
          name?: string
          proposer_name?: string | null
          proposer_phone?: string | null
          region?: string
          slug?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_settings: {
        Row: {
          default_discount_rate: number
          default_min_units: number
          id: boolean
          updated_at: string
        }
        Insert: {
          default_discount_rate?: number
          default_min_units?: number
          id?: boolean
          updated_at?: string
        }
        Update: {
          default_discount_rate?: number
          default_min_units?: number
          id?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      page_seo: {
        Row: {
          description: string
          path: string
          title: string
          updated_at: string
        }
        Insert: {
          description: string
          path: string
          title: string
          updated_at?: string
        }
        Update: {
          description?: string
          path?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      time_slot_availability: {
        Row: {
          date: string
          max_slots: number
          time_slot_id: string
          updated_at: string
        }
        Insert: {
          date: string
          max_slots?: number
          time_slot_id: string
          updated_at?: string
        }
        Update: {
          date?: string
          max_slots?: number
          time_slot_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_slot_availability_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      time_slots: {
        Row: {
          created_at: string
          default_max_slots: number
          id: string
          is_active: boolean
          label: string
          sort_order: number
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          default_max_slots?: number
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          default_max_slots?: number
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_admin_by_email: { Args: { _email: string }; Returns: string }
      admin_exists: { Args: never; Returns: boolean }
      bootstrap_first_admin: { Args: never; Returns: boolean }
      get_group_project_counts: {
        Args: never
        Returns: {
          group_project_id: string
          unit_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_admins: {
        Args: never
        Returns: {
          created_at: string
          email: string
          user_id: string
        }[]
      }
      remove_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
