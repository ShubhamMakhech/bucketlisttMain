export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)";
  };
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string;
          currency: string;
          display_order: number;
          distance: string;
          duration: string;
          experience_id: string;
          id: string;
          is_active: boolean;
          name: string;
          price: number;
          discount_percentage: number;
          discounted_price: number;
          b2bPrice: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          display_order?: number;
          distance: string;
          duration: string;
          experience_id: string;
          id?: string;
          is_active?: boolean;
          name: string;
          price: number;
          discount_percentage?: number;
          discounted_price?: number;
          b2bPrice?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          display_order?: number;
          distance?: string;
          duration?: string;
          experience_id?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          price?: number;
          discount_percentage?: number;
          discounted_price?: number;
          b2bPrice?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activities_experience_id_fkey";
            columns: ["experience_id"];
            isOneToOne: false;
            referencedRelation: "experiences";
            referencedColumns: ["id"];
          }
        ];
      };
      attractions: {
        Row: {
          category: string | null;
          created_at: string;
          description: string | null;
          destination_id: string | null;
          id: string;
          image_url: string | null;
          title: string;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          description?: string | null;
          destination_id?: string | null;
          id?: string;
          image_url?: string | null;
          title: string;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          description?: string | null;
          destination_id?: string | null;
          id?: string;
          image_url?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attractions_destination_id_fkey";
            columns: ["destination_id"];
            isOneToOne: false;
            referencedRelation: "destinations";
            referencedColumns: ["id"];
          }
        ];
      };
      booking_participants: {
        Row: {
          booking_id: string;
          created_at: string;
          email: string;
          id: string;
          name: string;
          phone_number: string;
        };
        Insert: {
          booking_id: string;
          created_at?: string;
          email: string;
          id?: string;
          name: string;
          phone_number: string;
        };
        Update: {
          booking_id?: string;
          created_at?: string;
          email?: string;
          id?: string;
          name?: string;
          phone_number?: string;
        };
        Relationships: [
          {
            foreignKeyName: "booking_participants_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          }
        ];
      };
      bookings: {
        Row: {
          booking_date: string;
          booking_time: string | null;
          created_at: string;
          experience_id: string;
          id: string;
          note_for_guide: string | null;
          status: string;
          terms_accepted: boolean;
          time_slot_id: string | null;
          total_participants: number;
          updated_at: string;
          user_id: string;
          referral_code: string | null;
        };
        Insert: {
          booking_date?: string;
          booking_time?: string | null;
          created_at?: string;
          experience_id: string;
          id?: string;
          note_for_guide?: string | null;
          status?: string;
          terms_accepted?: boolean;
          time_slot_id?: string | null;
          total_participants?: number;
          updated_at?: string;
          user_id: string;
          referral_code?: string | null;
        };
        Update: {
          booking_date?: string;
          booking_time?: string | null;
          created_at?: string;
          experience_id?: string;
          id?: string;
          note_for_guide?: string | null;
          status?: string;
          terms_accepted?: boolean;
          time_slot_id?: string | null;
          total_participants?: number;
          updated_at?: string;
          user_id?: string;
          referral_code?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_experience_id_fkey";
            columns: ["experience_id"];
            isOneToOne: false;
            referencedRelation: "experiences";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_time_slot_id_fkey";
            columns: ["time_slot_id"];
            isOneToOne: false;
            referencedRelation: "slot_availability";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_time_slot_id_fkey";
            columns: ["time_slot_id"];
            isOneToOne: false;
            referencedRelation: "time_slots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_referal_code_fkey";
            columns: ["referral_code"];
            isOneToOne: false;
            referencedRelation: "referal_codes";
            referencedColumns: ["id"];
          }
        ];
      };
      categories: {
        Row: {
          color: string | null;
          created_at: string;
          icon: string | null;
          id: string;
          name: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          icon?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          icon?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      destinations: {
        Row: {
          best_time_to_visit: string | null;
          created_at: string;
          currency: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          language: string | null;
          recommended_duration: string | null;
          subtitle: string | null;
          timezone: string | null;
          title: string;
          updated_at: string;
          weather_info: Json | null;
        };
        Insert: {
          best_time_to_visit?: string | null;
          created_at?: string;
          currency?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          language?: string | null;
          recommended_duration?: string | null;
          subtitle?: string | null;
          timezone?: string | null;
          title: string;
          updated_at?: string;
          weather_info?: Json | null;
        };
        Update: {
          best_time_to_visit?: string | null;
          created_at?: string;
          currency?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          language?: string | null;
          recommended_duration?: string | null;
          subtitle?: string | null;
          timezone?: string | null;
          title?: string;
          updated_at?: string;
          weather_info?: Json | null;
        };
        Relationships: [];
      };
      discount_coupons: {
        Row: {
          id: string;
          coupon_code: string;
          is_active: boolean;
          experience_id: string;
          type: string;
          discount_value: number;
          max_uses: number | null;
          used_count: number;
          valid_from: string;
          valid_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          coupon_code: string;
          is_active?: boolean;
          experience_id: string;
          type: string;
          discount_value: number;
          max_uses?: number | null;
          used_count?: number;
          valid_from?: string;
          valid_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          coupon_code?: string;
          is_active?: boolean;
          experience_id?: string;
          type?: string;
          discount_value?: number;
          max_uses?: number | null;
          used_count?: number;
          valid_from?: string;
          valid_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "discount_coupons_experience_id_fkey";
            columns: ["experience_id"];
            isOneToOne: false;
            referencedRelation: "experiences";
            referencedColumns: ["id"];
          }
        ];
      };
      experience_categories: {
        Row: {
          category_id: string;
          created_at: string;
          experience_id: string;
          id: string;
        };
        Insert: {
          category_id: string;
          created_at?: string;
          experience_id: string;
          id?: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          experience_id?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "experience_categories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "experience_categories_experience_id_fkey";
            columns: ["experience_id"];
            isOneToOne: false;
            referencedRelation: "experiences";
            referencedColumns: ["id"];
          }
        ];
      };
      experience_images: {
        Row: {
          alt_text: string | null;
          created_at: string;
          display_order: number | null;
          experience_id: string;
          id: string;
          image_url: string;
          is_primary: boolean | null;
        };
        Insert: {
          alt_text?: string | null;
          created_at?: string;
          display_order?: number | null;
          experience_id: string;
          id?: string;
          image_url: string;
          is_primary?: boolean | null;
        };
        Update: {
          alt_text?: string | null;
          created_at?: string;
          display_order?: number | null;
          experience_id?: string;
          id?: string;
          image_url?: string;
          is_primary?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "experience_images_experience_id_fkey";
            columns: ["experience_id"];
            isOneToOne: false;
            referencedRelation: "experiences";
            referencedColumns: ["id"];
          }
        ];
      };
      experiences: {
        Row: {
          category: string;
          category_id: string | null;
          created_at: string;
          currency: string | null;
          days_open: string[] | null;
          description: string | null;
          destination_id: string | null;
          distance_km: number | null;
          duration: string | null;
          end_point: string | null;
          google_maps_url: string | null;
          group_size: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          is_special_offer: boolean | null;
          latitude: number | null;
          location: string | null;
          longitude: number | null;
          original_price: number | null;
          place_id: string | null;
          price: number | null;
          rating: number | null;
          reviews_count: number | null;
          start_point: string | null;
          title: string;
          updated_at: string;
          vendor_id: string | null;
        };
        Insert: {
          category: string;
          category_id?: string | null;
          created_at?: string;
          currency?: string | null;
          days_open?: string[] | null;
          description?: string | null;
          destination_id?: string | null;
          distance_km?: number | null;
          duration?: string | null;
          end_point?: string | null;
          google_maps_url?: string | null;
          group_size?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          is_special_offer?: boolean | null;
          latitude?: number | null;
          location?: string | null;
          longitude?: number | null;
          original_price?: number | null;
          place_id?: string | null;
          price?: number | null;
          rating?: number | null;
          reviews_count?: number | null;
          start_point?: string | null;
          title: string;
          updated_at?: string;
          vendor_id?: string | null;
        };
        Update: {
          category?: string;
          category_id?: string | null;
          created_at?: string;
          currency?: string | null;
          days_open?: string[] | null;
          description?: string | null;
          destination_id?: string | null;
          distance_km?: number | null;
          duration?: string | null;
          end_point?: string | null;
          google_maps_url?: string | null;
          group_size?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          is_special_offer?: boolean | null;
          latitude?: number | null;
          location?: string | null;
          longitude?: number | null;
          original_price?: number | null;
          place_id?: string | null;
          price?: number | null;
          rating?: number | null;
          reviews_count?: number | null;
          start_point?: string | null;
          title?: string;
          updated_at?: string;
          vendor_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "experiences_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "experiences_destination_id_fkey";
            columns: ["destination_id"];
            isOneToOne: false;
            referencedRelation: "destinations";
            referencedColumns: ["id"];
          }
        ];
      };
      favorites: {
        Row: {
          created_at: string;
          experience_id: string;
          id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          experience_id: string;
          id?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          experience_id?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorites_experience_id_fkey";
            columns: ["experience_id"];
            isOneToOne: false;
            referencedRelation: "experiences";
            referencedColumns: ["id"];
          }
        ];
      };
      password_reset_otps: {
        Row: {
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          is_used: boolean;
          otp_code: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          expires_at: string;
          id?: string;
          is_used?: boolean;
          otp_code: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          is_used?: boolean;
          otp_code?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          first_name: string;
          id: string;
          last_name: string;
          phone_number: string | null;
          profile_picture_url: string | null;
          terms_accepted: boolean;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          first_name: string;
          id: string;
          last_name: string;
          phone_number?: string | null;
          profile_picture_url?: string | null;
          terms_accepted?: boolean;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          first_name?: string;
          id?: string;
          last_name?: string;
          phone_number?: string | null;
          profile_picture_url?: string | null;
          terms_accepted?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      time_slots: {
        Row: {
          activity_id: string | null;
          capacity: number;
          created_at: string;
          end_time: string;
          experience_id: string;
          id: string;
          start_time: string;
          updated_at: string;
        };
        Insert: {
          activity_id?: string | null;
          capacity?: number;
          created_at?: string;
          end_time: string;
          experience_id: string;
          id?: string;
          start_time: string;
          updated_at?: string;
        };
        Update: {
          activity_id?: string | null;
          capacity?: number;
          created_at?: string;
          end_time?: string;
          experience_id?: string;
          id?: string;
          start_time?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "time_slots_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "time_slots_experience_id_fkey";
            columns: ["experience_id"];
            isOneToOne: false;
            referencedRelation: "experiences";
            referencedColumns: ["id"];
          }
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      slot_availability: {
        Row: {
          available_spots: number | null;
          booked_count: number | null;
          capacity: number | null;
          end_time: string | null;
          experience_id: string | null;
          id: string | null;
          start_time: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "time_slots_experience_id_fkey";
            columns: ["experience_id"];
            isOneToOne: false;
            referencedRelation: "experiences";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Functions: {
      has_role: {
        Args: {
          _user_id: string;
          _role: Database["public"]["Enums"]["app_role"];
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "customer" | "vendor";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "customer", "vendor"],
    },
  },
} as const;
