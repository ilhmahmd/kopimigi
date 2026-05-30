// Auto-generated from Supabase schema.
// Regenerate with: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > packages/shared/supabase/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      app_users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'owner' | 'manager' | 'cashier'
          avatar_url: string | null
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['app_users']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['app_users']['Insert']>
      }
      categories: {
        Row: {
          id: string
          name: string
          icon: string | null
          color: string | null
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
      products: {
        Row: {
          id: string
          category_id: string
          name: string
          description: string | null
          price: number
          image_url: string | null
          is_available: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      discounts: {
        Row: {
          id: string
          code: string
          name: string
          type: 'percentage' | 'fixed'
          value: number
          min_order: number | null
          max_uses: number | null
          used_count: number
          is_active: boolean
          valid_from: string | null
          valid_until: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['discounts']['Row'], 'id' | 'used_count' | 'created_at'>
        Update: Partial<Database['public']['Tables']['discounts']['Insert']>
      }
      orders: {
        Row: {
          id: string
          order_number: string
          cashier_id: string
          subtotal: number
          discount_id: string | null
          discount_amount: number
          tax_amount: number
          total: number
          payment_method: 'cash' | 'qris' | 'debit' | 'credit'
          amount_paid: number
          change_amount: number
          status: 'pending' | 'paid' | 'completed' | 'cancelled'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          product_name: string
          product_price: number
          quantity: number
          subtotal: number
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>
      }
      photo_sessions: {
        Row: {
          id: string
          order_id: string
          token: string
          token_url: string
          access_code: string
          with_photo: boolean
          background_id: string | null
          status: 'pending' | 'used' | 'expired'
          photo_url: string | null
          thumbnail_url: string | null
          processed_photo_url: string | null
          receipt_image_url: string | null
          expires_at: string
          used_at: string | null
          printed_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['photo_sessions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['photo_sessions']['Insert']>
      }
    }
    Views: {
      daily_sales_summary: {
        Row: {
          date: string
          total_orders: number
          total_revenue: number
          total_discount: number
        }
      }
    }
    Functions: {
      generate_order_number: {
        Args: Record<string, never>
        Returns: string
      }
    }
  }
}
