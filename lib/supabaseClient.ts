import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// The '!' tells TypeScript that we are sure these values will not be null.
// Next.js ensures these are available at runtime.

export const supabase = createClient(supabaseUrl, supabaseAnonKey)