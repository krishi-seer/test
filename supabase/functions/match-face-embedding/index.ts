import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface FaceEmbeddingRequest {
  embedding: number[]
  threshold?: number
}

interface FaceMatchResponse {
  profile_id: string
  user_id: string
  distance: number
  name: string | null
  mobile: string | null
  location: string | null
  crops: string | null
}

Deno.serve(async (req) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // Parse request body
    const body: FaceEmbeddingRequest = await req.json()

    // Validate input
    if (!body.embedding || !Array.isArray(body.embedding) || body.embedding.length !== 128) {
      return new Response(
        JSON.stringify({
          error: 'Invalid embedding: must be an array of 128 numbers'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate that all values are numbers
    if (!body.embedding.every(val => typeof val === 'number' && !isNaN(val))) {
      return new Response(
        JSON.stringify({
          error: 'Invalid embedding: all values must be valid numbers'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Convert embedding array to PostgreSQL vector format
    const embeddingVector = `[${body.embedding.join(',')}]`
    const threshold = body.threshold || 0.42

    // Call the RPC function to find closest match
    const { data, error } = await supabase.rpc('find_closest_profile_by_embedding', {
      input_embedding: embeddingVector,
      distance_threshold: threshold
    })

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({
          error: 'Database query failed',
          details: error.message
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Return the match result
    if (data && data.length > 0) {
      const match: FaceMatchResponse = data[0]
      return new Response(
        JSON.stringify({
          success: true,
          match: match,
          message: 'Face match found'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          match: null,
          message: 'No matching face found'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})