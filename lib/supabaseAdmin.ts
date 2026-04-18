import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Admin Client — uses the Service Role Key.
 * NEVER import this in client components. Server-side only (API routes, Server Actions).
 * This bypasses RLS to perform biometric verification and user creation.
 */
export function getSupabaseAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase environment variables not configured')
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}
