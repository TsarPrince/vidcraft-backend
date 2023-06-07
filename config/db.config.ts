import { createClient } from '@supabase/supabase-js'
import { Database } from '../lib/database.types'

// Initialize Supabase client
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false
  }
})

export default supabase