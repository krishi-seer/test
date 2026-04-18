import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const FACE_MATCH_THRESHOLD = parseFloat(
  process.env.FACE_MATCH_THRESHOLD || '0.42'
);

/**
 * POST /api/auth/verify-face
 * 
 * Matches incoming face descriptor against all registered farmers.
 * Uses pgvector cosine similarity to find the closest match.
 * Returns user_id and farmer details if match found.
 * 
 * Request body:
 * {
 *   "faceDescriptor": [128 numbers]  // From face-api.js
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "userId": "uuid",
 *   "name": "Farmer Name",
 *   "mobile": "+919876543210",
 *   "location": "Village, State",
 *   "crops": "Wheat, Rice",
 *   "distance": 0.35  // Cosine distance (lower = better match)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { faceDescriptor } = await req.json();

    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      return NextResponse.json(
        { error: 'Invalid face descriptor' },
        { status: 400 }
      );
    }

    if (faceDescriptor.length !== 128) {
      return NextResponse.json(
        { error: 'Face descriptor must be 128-dimensional' },
        { status: 400 }
      );
    }

    // Convert array to PostgreSQL vector format
    const vectorStr = `[${faceDescriptor.join(',')}]`;

    // Call the match_face_descriptor function
    const { data: matches, error: matchError } = await supabase.rpc(
      'match_face_descriptor',
      {
        input_descriptor: vectorStr,
        distance_threshold: FACE_MATCH_THRESHOLD,
      }
    );

    if (matchError) {
      console.error('Match error:', matchError);
      return NextResponse.json(
        { error: 'Face matching failed' },
        { status: 500 }
      );
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json(
        { error: 'Face not recognized. Please sign up first.' },
        { status: 401 }
      );
    }

    const match = matches[0];
    const userId = match.user_id;
    const distance = match.distance;

    // Fetch farmer profile with full details
    const { data: farmer, error: fetchError } = await supabase
      .from('farmers')
      .select('id, name, mobile, location, crops, email')
      .eq('id', userId)
      .single();

    if (fetchError || !farmer) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Update match stats
    await supabase.rpc('update_match_stats', {
      p_user_id: userId,
      p_successful: true,
    });

    // Log successful login attempt
    await supabase.from('face_login_attempts').insert({
      user_id: userId,
      attempt_type: 'success',
      descriptor_distance: distance,
      ip_address: req.ip || '0.0.0.0',
    });

    // Create a session/JWT token
    // Since we're using Supabase Auth, we need to create a custom token
    // or use a workaround. For now, return user info and let frontend handle session
    const response = NextResponse.json({
      success: true,
      userId,
      name: farmer.name,
      mobile: farmer.mobile,
      location: farmer.location,
      crops: farmer.crops,
      email: farmer.email,
      distance, // For debugging
    });

    // Optional: Set a secure httpOnly cookie with user info (timestamp verification)
    response.cookies.set('face_auth_user_id', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: any) {
    console.error('Face verification error:', err);
    return NextResponse.json(
      { error: 'Verification failed: ' + err.message },
      { status: 500 }
    );
  }
}
