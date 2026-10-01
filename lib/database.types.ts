// Generado por el MCP de Supabase (generate_typescript_types). No editar a mano.
// Regenerar tras cada migración que cambie el esquema.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      games: {
        Row: {
          cat: Database["public"]["Enums"]["game_category"];
          color: Database["public"]["Enums"]["game_color"];
          cover: string;
          created_at: string;
          id: string;
          leaderboard_size: number;
          long: string;
          max_score: number;
          score_label: string;
          score_order: Database["public"]["Enums"]["score_order"];
          scores_table: string;
          short: string;
          sort_order: number;
          title: string;
        };
        Insert: {
          cat: Database["public"]["Enums"]["game_category"];
          color: Database["public"]["Enums"]["game_color"];
          cover: string;
          created_at?: string;
          id: string;
          leaderboard_size?: number;
          long: string;
          max_score?: number;
          score_label?: string;
          score_order?: Database["public"]["Enums"]["score_order"];
          scores_table: string;
          short: string;
          sort_order: number;
          title: string;
        };
        Update: {
          cat?: Database["public"]["Enums"]["game_category"];
          color?: Database["public"]["Enums"]["game_color"];
          cover?: string;
          created_at?: string;
          id?: string;
          leaderboard_size?: number;
          long?: string;
          max_score?: number;
          score_label?: string;
          score_order?: Database["public"]["Enums"]["score_order"];
          scores_table?: string;
          short?: string;
          sort_order?: number;
          title?: string;
        };
        Relationships: [];
      };
      scores_bloque_buster: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          score: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          score: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          score?: number;
        };
        Relationships: [];
      };
      scores_caida: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          score: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          score: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          score?: number;
        };
        Relationships: [];
      };
      scores_duelo_pixel: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          score: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          score: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          score?: number;
        };
        Relationships: [];
      };
      scores_gloton: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          score: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          score: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          score?: number;
        };
        Relationships: [];
      };
      scores_invasores: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          score: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          score: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          score?: number;
        };
        Relationships: [];
      };
      scores_ranaria: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          score: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          score: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          score?: number;
        };
        Relationships: [];
      };
      scores_rocas: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          score: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          score: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          score?: number;
        };
        Relationships: [];
      };
      scores_serpentina: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          score: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          score: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          score?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      game_stats: {
        Row: {
          best: number | null;
          game_id: string | null;
          plays: number | null;
        };
        Relationships: [];
      };
      leaderboard: {
        Row: {
          created_at: string | null;
          game_id: string | null;
          id: string | null;
          name: string | null;
          score: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      submit_score: {
        Args: { p_game: string; p_name: string; p_score: number };
        Returns: undefined;
      };
      top_scores: {
        Args: { p_game?: string };
        Returns: {
          created_at: string;
          game_id: string;
          name: string;
          rank: number;
          score: number;
        }[];
      };
    };
    Enums: {
      game_category: "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
      game_color: "cyan" | "magenta" | "yellow" | "green";
      score_order: "asc" | "desc";
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      game_category: ["ARCADE", "PUZZLE", "SHOOTER", "VERSUS"],
      game_color: ["cyan", "magenta", "yellow", "green"],
      score_order: ["asc", "desc"],
    },
  },
} as const;
