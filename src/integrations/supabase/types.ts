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
      companies: {
        Row: {
          created_at: string
          id: string
          is_grc: boolean
          linked_to_grc: boolean
          name: string
          owner_user_id: string
          plan: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_grc?: boolean
          linked_to_grc?: boolean
          name: string
          owner_user_id: string
          plan?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_grc?: boolean
          linked_to_grc?: boolean
          name?: string
          owner_user_id?: string
          plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_products: {
        Row: {
          company_id: string
          cost_price: number | null
          created_at: string
          id: string
          retail_price: number | null
          source_product_id: string
          status: Database["public"]["Enums"]["product_status"]
          updated_at: string
          wholesale_price: number | null
        }
        Insert: {
          company_id: string
          cost_price?: number | null
          created_at?: string
          id?: string
          retail_price?: number | null
          source_product_id: string
          status?: Database["public"]["Enums"]["product_status"]
          updated_at?: string
          wholesale_price?: number | null
        }
        Update: {
          company_id?: string
          cost_price?: number | null
          created_at?: string
          id?: string
          retail_price?: number | null
          source_product_id?: string
          status?: Database["public"]["Enums"]["product_status"]
          updated_at?: string
          wholesale_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_products_source_product_id_fkey"
            columns: ["source_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_products_source_product_id_fkey"
            columns: ["source_product_id"]
            isOneToOne: false
            referencedRelation: "products_seller_view"
            referencedColumns: ["id"]
          },
        ]
      }
      company_users: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["company_role"]
          status: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["company_role"]
          status?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["company_role"]
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_automation_intents: {
        Row: {
          company_id: string | null
          completed_at: string | null
          created_at: string | null
          creative_id: string | null
          id: string
          intent_type: string
          metadata: Json | null
          product_id: string | null
          result_notes: string | null
          status: string | null
          triggered_at: string | null
          triggered_by: string | null
        }
        Insert: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          creative_id?: string | null
          id?: string
          intent_type: string
          metadata?: Json | null
          product_id?: string | null
          result_notes?: string | null
          status?: string | null
          triggered_at?: string | null
          triggered_by?: string | null
        }
        Update: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          creative_id?: string | null
          id?: string
          intent_type?: string
          metadata?: Json | null
          product_id?: string | null
          result_notes?: string | null
          status?: string | null
          triggered_at?: string | null
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creative_automation_intents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_automation_intents_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "creatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_automation_intents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_automation_intents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_seller_view"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_files: {
        Row: {
          channel_used: string | null
          created_at: string | null
          creative_id: string
          file_name: string
          file_role: Database["public"]["Enums"]["creative_file_role"]
          file_type: Database["public"]["Enums"]["creative_file_type"]
          file_url: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["creative_file_status"]
          updated_at: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          channel_used?: string | null
          created_at?: string | null
          creative_id: string
          file_name: string
          file_role?: Database["public"]["Enums"]["creative_file_role"]
          file_type: Database["public"]["Enums"]["creative_file_type"]
          file_url: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["creative_file_status"]
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          channel_used?: string | null
          created_at?: string | null
          creative_id?: string
          file_name?: string
          file_role?: Database["public"]["Enums"]["creative_file_role"]
          file_type?: Database["public"]["Enums"]["creative_file_type"]
          file_url?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["creative_file_status"]
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creative_files_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "creatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creatives: {
        Row: {
          ai_prompt: string | null
          audience_notes: string | null
          automation_intent: string | null
          automation_status: string | null
          channel: Database["public"]["Enums"]["creative_channel"]
          company_id: string | null
          copy: string | null
          created_at: string
          cta_text: string | null
          engagement_level: string | null
          hook_text: string | null
          hook_type: string | null
          id: string
          image_url: string | null
          learning: string | null
          message_approach: string | null
          metric_clicks: number | null
          metric_comments: number | null
          metric_cost: number | null
          metric_impressions: number | null
          metric_known_people: string | null
          metric_likes: number | null
          metric_messages: number | null
          metric_sales: number | null
          objective: Database["public"]["Enums"]["creative_objective"]
          product_id: string | null
          publication_reference: string | null
          published_at: string | null
          result: Database["public"]["Enums"]["creative_result"]
          script: string | null
          status: Database["public"]["Enums"]["creative_status"]
          target_audience: string | null
          title: string | null
          type: Database["public"]["Enums"]["creative_type"]
          updated_at: string
          variation: string | null
          video_url: string | null
          vs_previous: string | null
          vs_previous_id: string | null
          what_changed: string | null
        }
        Insert: {
          ai_prompt?: string | null
          audience_notes?: string | null
          automation_intent?: string | null
          automation_status?: string | null
          channel?: Database["public"]["Enums"]["creative_channel"]
          company_id?: string | null
          copy?: string | null
          created_at?: string
          cta_text?: string | null
          engagement_level?: string | null
          hook_text?: string | null
          hook_type?: string | null
          id?: string
          image_url?: string | null
          learning?: string | null
          message_approach?: string | null
          metric_clicks?: number | null
          metric_comments?: number | null
          metric_cost?: number | null
          metric_impressions?: number | null
          metric_known_people?: string | null
          metric_likes?: number | null
          metric_messages?: number | null
          metric_sales?: number | null
          objective?: Database["public"]["Enums"]["creative_objective"]
          product_id?: string | null
          publication_reference?: string | null
          published_at?: string | null
          result?: Database["public"]["Enums"]["creative_result"]
          script?: string | null
          status?: Database["public"]["Enums"]["creative_status"]
          target_audience?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["creative_type"]
          updated_at?: string
          variation?: string | null
          video_url?: string | null
          vs_previous?: string | null
          vs_previous_id?: string | null
          what_changed?: string | null
        }
        Update: {
          ai_prompt?: string | null
          audience_notes?: string | null
          automation_intent?: string | null
          automation_status?: string | null
          channel?: Database["public"]["Enums"]["creative_channel"]
          company_id?: string | null
          copy?: string | null
          created_at?: string
          cta_text?: string | null
          engagement_level?: string | null
          hook_text?: string | null
          hook_type?: string | null
          id?: string
          image_url?: string | null
          learning?: string | null
          message_approach?: string | null
          metric_clicks?: number | null
          metric_comments?: number | null
          metric_cost?: number | null
          metric_impressions?: number | null
          metric_known_people?: string | null
          metric_likes?: number | null
          metric_messages?: number | null
          metric_sales?: number | null
          objective?: Database["public"]["Enums"]["creative_objective"]
          product_id?: string | null
          publication_reference?: string | null
          published_at?: string | null
          result?: Database["public"]["Enums"]["creative_result"]
          script?: string | null
          status?: Database["public"]["Enums"]["creative_status"]
          target_audience?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["creative_type"]
          updated_at?: string
          variation?: string | null
          video_url?: string | null
          vs_previous?: string | null
          vs_previous_id?: string | null
          what_changed?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creatives_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "creatives_vs_previous_id_fkey"
            columns: ["vs_previous_id"]
            isOneToOne: false
            referencedRelation: "creatives"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          auto_promote: boolean | null
          category: string | null
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
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
          company_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          name: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          client_name: string | null
          client_phone: string | null
          company_id: string | null
          cost_at_sale: number | null
          created_at: string
          final_price: number | null
          id: string
          margin_at_sale: number | null
          margin_percent_at_sale: number | null
          my_percentage: number
          my_profit_amount: number
          notes: string | null
          operational_status:
            | Database["public"]["Enums"]["operational_status"]
            | null
          order_status: Database["public"]["Enums"]["order_status"] | null
          partner_percentage: number
          partner_profit_amount: number
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          product_id: string | null
          quantity: number
          related_creative_id: string | null
          reseller_price: number | null
          reseller_profit: number | null
          sale_date: string
          sale_source: Database["public"]["Enums"]["sale_source"]
          sale_type: Database["public"]["Enums"]["sale_type"]
          sales_channel: string | null
          seller_id: string | null
          status_updated_at: string | null
          total_amount: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          client_phone?: string | null
          company_id?: string | null
          cost_at_sale?: number | null
          created_at?: string
          final_price?: number | null
          id?: string
          margin_at_sale?: number | null
          margin_percent_at_sale?: number | null
          my_percentage?: number
          my_profit_amount?: number
          notes?: string | null
          operational_status?:
            | Database["public"]["Enums"]["operational_status"]
            | null
          order_status?: Database["public"]["Enums"]["order_status"] | null
          partner_percentage?: number
          partner_profit_amount?: number
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          product_id?: string | null
          quantity?: number
          related_creative_id?: string | null
          reseller_price?: number | null
          reseller_profit?: number | null
          sale_date?: string
          sale_source?: Database["public"]["Enums"]["sale_source"]
          sale_type?: Database["public"]["Enums"]["sale_type"]
          sales_channel?: string | null
          seller_id?: string | null
          status_updated_at?: string | null
          total_amount?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          client_phone?: string | null
          company_id?: string | null
          cost_at_sale?: number | null
          created_at?: string
          final_price?: number | null
          id?: string
          margin_at_sale?: number | null
          margin_percent_at_sale?: number | null
          my_percentage?: number
          my_profit_amount?: number
          notes?: string | null
          operational_status?:
            | Database["public"]["Enums"]["operational_status"]
            | null
          order_status?: Database["public"]["Enums"]["order_status"] | null
          partner_percentage?: number
          partner_profit_amount?: number
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          product_id?: string | null
          quantity?: number
          related_creative_id?: string | null
          reseller_price?: number | null
          reseller_profit?: number | null
          sale_date?: string
          sale_source?: Database["public"]["Enums"]["sale_source"]
          sale_type?: Database["public"]["Enums"]["sale_type"]
          sales_channel?: string | null
          seller_id?: string | null
          status_updated_at?: string | null
          total_amount?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "sales_related_creative_id_fkey"
            columns: ["related_creative_id"]
            isOneToOne: false
            referencedRelation: "creatives"
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
          company_id: string | null
          contact: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          status: Database["public"]["Enums"]["seller_status"]
          type: string | null
          updated_at: string
        }
        Insert: {
          commission?: number | null
          company_id?: string | null
          contact?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          status?: Database["public"]["Enums"]["seller_status"]
          type?: string | null
          updated_at?: string
        }
        Update: {
          commission?: number | null
          company_id?: string | null
          contact?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["seller_status"]
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sellers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          company_id: string | null
          conditions: string | null
          contact: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          conditions?: string | null
          contact?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          conditions?: string | null
          contact?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      task_outcomes: {
        Row: {
          completed_at: string
          completed_by: string | null
          created_at: string
          generated_income: boolean
          id: string
          income_amount: number | null
          notes: string | null
          result: Database["public"]["Enums"]["task_outcome_result"]
          task_id: string
        }
        Insert: {
          completed_at?: string
          completed_by?: string | null
          created_at?: string
          generated_income?: boolean
          id?: string
          income_amount?: number | null
          notes?: string | null
          result: Database["public"]["Enums"]["task_outcome_result"]
          task_id: string
        }
        Update: {
          completed_at?: string
          completed_by?: string | null
          created_at?: string
          generated_income?: boolean
          id?: string
          income_amount?: number | null
          notes?: string | null
          result?: Database["public"]["Enums"]["task_outcome_result"]
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_outcomes_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          action_label: string | null
          action_path: string | null
          assigned_to: string | null
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      get_user_company_id: { Args: never; Returns: string }
      has_company_role: {
        Args: {
          _company_id: string
          _role: Database["public"]["Enums"]["company_role"]
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_admin: { Args: { _company_id: string }; Returns: boolean }
      user_belongs_to_company: {
        Args: { _company_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "colaborador"
      company_role: "owner" | "admin" | "collaborator" | "seller"
      creative_channel: "whatsapp" | "instagram" | "tiktok" | "facebook" | "web"
      creative_file_role: "principal" | "variacion" | "referencia"
      creative_file_status: "borrador" | "publicado" | "descartado"
      creative_file_type: "imagen" | "video"
      creative_objective: "vender" | "atraer" | "probar"
      creative_result: "sin_evaluar" | "funciono" | "no_funciono"
      creative_status:
        | "pendiente"
        | "generando"
        | "generado"
        | "publicado"
        | "descartado"
      creative_type: "imagen" | "video" | "copy"
      operational_status:
        | "nuevo"
        | "contactado"
        | "confirmado"
        | "sin_respuesta"
        | "en_ruta"
        | "entregado"
        | "riesgo_devolucion"
      order_status: "pendiente" | "en_progreso" | "entregado"
      payment_status: "pendiente" | "pagado"
      product_status: "activo" | "pausado" | "agotado"
      sale_source: "digital" | "presencial"
      sale_type: "directa" | "revendedor"
      seller_status: "activo" | "inactivo"
      task_impact: "dinero" | "crecimiento" | "operacion"
      task_outcome_result: "exitoso" | "fallido" | "reprogramado" | "cancelado"
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
      company_role: ["owner", "admin", "collaborator", "seller"],
      creative_channel: ["whatsapp", "instagram", "tiktok", "facebook", "web"],
      creative_file_role: ["principal", "variacion", "referencia"],
      creative_file_status: ["borrador", "publicado", "descartado"],
      creative_file_type: ["imagen", "video"],
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
      operational_status: [
        "nuevo",
        "contactado",
        "confirmado",
        "sin_respuesta",
        "en_ruta",
        "entregado",
        "riesgo_devolucion",
      ],
      order_status: ["pendiente", "en_progreso", "entregado"],
      payment_status: ["pendiente", "pagado"],
      product_status: ["activo", "pausado", "agotado"],
      sale_source: ["digital", "presencial"],
      sale_type: ["directa", "revendedor"],
      seller_status: ["activo", "inactivo"],
      task_impact: ["dinero", "crecimiento", "operacion"],
      task_outcome_result: ["exitoso", "fallido", "reprogramado", "cancelado"],
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
