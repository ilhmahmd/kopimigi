import { createClient } from '@supabase/supabase-js'
// Ambil tipe Database dari workspace shared lokal Anda
import { Database } from '@coffeeshop/shared/supabase/database.types' 

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Berikan skema Database ke createClient
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)