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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      creatives: {
        Row: {
          ai_prompt: string | null
          channel: Database["public"]["Enums"]["creative_channel"]
          copy: string | null
          created_at: string
          id: string
          image_url: string | null
          learning: string | null
          objective: Database["public"]["Enums"]["creative_objective"]
          product_id: string | null
          published_at: string | null
          result: Database["public"]["Enums"]["creative_result"]
          script: string | null
          status: Database["public"]["Enums"]["creative_status"]
          title: string | null
          type: Database["public"]["Enums"]["creative_type"]
          updated_at: string
          video_url: string | null
        }
        Insert: {
          ai_prompt?: string | null
          channel?: Database["public"]["Enums"]["creative_channel"]
          copy?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          learning?: string | null
          objective?: Database["public"]["Enums"]["creative_objective"]
          product_id?: string | null
          published_at?: string | null
          result?: Database["public"]["Enums"]["creative_result"]
          script?: string | null
          status?: Database["public"]["Enums"]["creative_status"]
          title?: string | null
          type?: Database["public"]["Enums"]["creative_type"]
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          ai_prompt?: string | null
          channel?: Database["public"]["Enums"]["creative_channel"]
          copy?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          learning?: string | null
          objective?: Database["public"]["Enums"]["creative_objective"]
          product_id?: string | null
          published_at?: string | null
          result?: Database["public"]["Enums"]["creative_result"]
          script?: string | null
          status?: Database["public"]["Enums"]["creative_status"]
          title?: string | null
          type?: Database["public"]["Enums"]["creative_type"]
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creatives_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creatives_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_seller_view"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          auto_promote: boolean | null
          category: string | null
          created_at: string
          delivery_type: string | null
          description: string | null
          id: string
          image_url: string | null
          internal_notes: string | null
          is_featured: boolean
          main_channel: string | null
          name: string
          price: number
          sku: string | null
          status: Database["public"]["Enums"]["product_status"]
          store_name: string | null
          suggested_price: number | null
          supplier_id: string | null
          supplier_price: number | null
          updated_at: string
          wholesale_price: number | null
        }
        Insert: {
          auto_promote?: boolean | null
          category?: string | null
          created_at?: string
          delivery_type?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          internal_notes?: string | null
          is_featured?: boolean
          main_channel?: string | null
          name: string
          price?: number
          sku?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          store_name?: string | null
          suggested_price?: number | null
          supplier_id?: string | null
          supplier_price?: number | null
          updated_at?: string
          wholesale_price?: number | null
        }
        Update: {
          auto_promote?: boolean | null
          category?: string | null
          created_at?: string
          delivery_type?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          internal_notes?: string | null
          is_featured?: boolean
          main_channel?: string | null
          name?: string
          price?: number
          sku?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          store_name?: string | null
          suggested_price?: number | null
          supplier_id?: string | null
          supplier_price?: number | null
          updated_at?: string
          wholesale_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          client_name: string | null
          client_phone: string | null
          created_at: string
          id: string
          notes: string | null
          order_status: Database["public"]["Enums"]["order_status"] | null
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          product_id: string | null
          quantity: number
          sale_date: string
          sales_channel: string | null
          seller_id: string | null
          total_amount: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_status?: Database["public"]["Enums"]["order_status"] | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          product_id?: string | null
          quantity?: number
          sale_date?: string
          sales_channel?: string | null
          seller_id?: string | null
          total_amount?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_status?: Database["public"]["Enums"]["order_status"] | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          product_id?: string | null
          quantity?: number
          sale_date?: string
          sales_channel?: string | null
          seller_id?: string | null
          total_amount?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_seller_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          commission: number | null
          contact: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          status: Database["public"]["Enums"]["seller_status"]
          updated_at: string
        }
        Insert: {
          commission?: number | null
          contact?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          status?: Database["public"]["Enums"]["seller_status"]
          updated_at?: string
        }
        Update: {
          commission?: number | null
          contact?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["seller_status"]
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          conditions: string | null
          contact: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          conditions?: string | null
          contact?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          conditions?: string | null
          contact?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          action_label: string | null
          action_path: string | null
          assigned_to: string | null
          consequence: string | null
          context: Json | null
          created_at: string
          dedup_key: string | null
          description: string | null
          due_date: string | null
          id: string
          impact: Database["public"]["Enums"]["task_impact"] | null
          name: string
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string | null
          reason: string | null
          related_creative_id: string | null
          related_product_id: string | null
          related_sale_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          source: Database["public"]["Enums"]["task_source"] | null
          status: Database["public"]["Enums"]["task_status"]
          trigger_reason: string | null
          type: Database["public"]["Enums"]["task_type"] | null
        }
        Insert: {
          action_label?: string | null
          action_path?: string | null
          assigned_to?: string | null
          consequence?: string | null
          context?: Json | null
          created_at?: string
          dedup_key?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          impact?: Database["public"]["Enums"]["task_impact"] | null
          name: string
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          reason?: string | null
          related_creative_id?: string | null
          related_product_id?: string | null
          related_sale_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          source?: Database["public"]["Enums"]["task_source"] | null
          status?: Database["public"]["Enums"]["task_status"]
          trigger_reason?: string | null
          type?: Database["public"]["Enums"]["task_type"] | null
        }
        Update: {
          action_label?: string | null
          action_path?: string | null
          assigned_to?: string | null
          consequence?: string | null
          context?: Json | null
          created_at?: string
          dedup_key?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          impact?: Database["public"]["Enums"]["task_impact"] | null
          name?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          reason?: string | null
          related_creative_id?: string | null
          related_product_id?: string | null
          related_sale_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          source?: Database["public"]["Enums"]["task_source"] | null
          status?: Database["public"]["Enums"]["task_status"]
          trigger_reason?: string | null
          type?: Database["public"]["Enums"]["task_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_creative_id_fkey"
            columns: ["related_creative_id"]
            isOneToOne: false
            referencedRelation: "creatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_product_id_fkey"
            columns: ["related_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_product_id_fkey"
            columns: ["related_product_id"]
            isOneToOne: false
            referencedRelation: "products_seller_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_sale_id_fkey"
            columns: ["related_sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      products_seller_view: {
        Row: {
          category: string | null
          created_at: string | null
          delivery_type: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_featured: boolean | null
          main_channel: string | null
          name: string | null
          retail_price: number | null
          sku: string | null
          status: Database["public"]["Enums"]["product_status"] | null
          updated_at: string | null
          wholesale_price: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          delivery_type?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_featured?: boolean | null
          main_channel?: string | null
          name?: string | null
          retail_price?: number | null
          sku?: string | null
          status?: Database["public"]["Enums"]["product_status"] | null
          updated_at?: string | null
          wholesale_price?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          delivery_type?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_featured?: boolean | null
          main_channel?: string | null
          name?: string | null
          retail_price?: number | null
          sku?: string | null
          status?: Database["public"]["Enums"]["product_status"] | null
          updated_at?: string | null
          wholesale_price?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "colaborador"
      creative_channel: "whatsapp" | "instagram" | "tiktok" | "facebook" | "web"
      creative_objective: "vender" | "atraer" | "probar"
      creative_result: "sin_evaluar" | "funciono" | "no_funciono"
      creative_status:
        | "pendiente"
        | "generando"
        | "generado"
        | "publicado"
        | "descartado"
      creative_type: "imagen" | "video" | "copy"
      order_status: "pendiente" | "en_progreso" | "entregado"
      payment_status: "pendiente" | "pagado"
      product_status: "activo" | "pausado" | "agotado"
      seller_status: "activo" | "inactivo"
      task_impact: "dinero" | "crecimiento" | "operacion"
      task_priority: "alta" | "media" | "baja"
      task_source: "manual" | "automatic"
      task_status: "pendiente" | "en_progreso" | "terminada"
      task_type:
        | "cobro"
        | "seguimiento_venta"
        | "creativo"
        | "operacion"
        | "estrategia"
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
    Enums: {
      app_role: ["admin", "colaborador"],
      creative_channel: ["whatsapp", "instagram", "tiktok", "facebook", "web"],
      creative_objective: ["vender", "atraer", "probar"],
      creative_result: ["sin_evaluar", "funciono", "no_funciono"],
      creative_status: [
        "pendiente",
        "generando",
        "generado",
        "publicado",
        "descartado",
      ],
      creative_type: ["imagen", "video", "copy"],
      order_status: ["pendiente", "en_progreso", "entregado"],
      payment_status: ["pendiente", "pagado"],
      product_status: ["activo", "pausado", "agotado"],
      seller_status: ["activo", "inactivo"],
      task_impact: ["dinero", "crecimiento", "operacion"],
      task_priority: ["alta", "media", "baja"],
      task_source: ["manual", "automatic"],
      task_status: ["pendiente", "en_progreso", "terminada"],
      task_type: [
        "cobro",
        "seguimiento_venta",
        "creativo",
        "operacion",
        "estrategia",
      ],
    },
  },
} as const
