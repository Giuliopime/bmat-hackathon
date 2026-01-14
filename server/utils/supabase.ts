import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type Database = any

let cached: SupabaseClient<Database> | null = null

export const getSupabaseClient = () => {
  if (cached) {
    return cached
  }

  const config = useRuntimeConfig()

  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    throw new Error('Supabase credentials are missing. Please set supabaseUrl and supabaseServiceKey in runtimeConfig.')
  }

  cached = createClient<Database>(config.supabaseUrl, config.supabaseServiceKey)

  return cached
}
