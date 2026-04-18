import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const storageBucketName = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'farmer-photos';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables are not set. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * POST /api/auth/voice-signup-with-face
 * 
 * Registers a new farmer with voice-collected data + face biometric.
 * 
 * Request body:
 * {
 *   "name": "Farmer Name",
 *   "mobile": "+919876543210",
 *   "location": "Village, State",
 *   "crops": "Wheat, Rice",
 *   "faceDescriptor": [128 numbers],  // From face-api.js
 *   "photo": "data:image/jpeg;base64,..."  // Base64 photo
 * }
 * 
 * Flow:
 * 1. Create Supabase Auth user (anonymous or email-based)
 * 2. Upload photo to Storage
 * 3. Store face descriptor in user_biometrics (pgvector)
 * 4. Store farmer profile + mobile in farmers table
 * 5. Return success + auto-login
 */
export async function POST(req: NextRequest) {
  try {
    console.log('Voice signup API called');
    const { name, mobile, location, crops, faceDescriptor, photo } = await req.json();
    console.log('Received data:', { name, mobile, location, crops, faceDescriptorLength: faceDescriptor?.length });

    // Create supabase client lazily so missing env vars give a clear error
    const supabase = getSupabaseAdmin();

    // Validation
    if (!name || !mobile || !location || !crops) {
      return NextResponse.json(
        { error: 'Name, mobile, location, and crops are required' },
        { status: 400 }
      );
    }

    if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return NextResponse.json(
        { error: 'Invalid face descriptor (must be 128-dimensional)' },
        { status: 400 }
      );
    }

    if (!photo || !photo.startsWith('data:')) {
      return NextResponse.json(
        { error: 'Invalid photo data' },
        { status: 400 }
      );
    }

    // Step 1: Create Auth user (anonymous by default, can be email-based later)
    // Generate a temporary email based on timestamp
    const tempEmail = `farmer_${Date.now()}@krishi-seer.local`;
    const tempPassword = Math.random().toString(36).slice(-16);

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: tempEmail,
      password: tempPassword,
      email_confirm: true, // Auto-confirm to skip email verification
    });

    if (authError || !authUser.user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    const userId = authUser.user.id;

    try {
      // Step 2: Upload photo to Storage
      const photoFileName = `user/${userId}/${Date.now()}-photo.jpg`;
      const photoBuffer = Buffer.from(
        photo.replace(/^data:image\/\w+;base64,/, ''),
        'base64'
      );

      const { error: uploadError } = await supabase.storage
        .from(storageBucketName)
        .upload(photoFileName, photoBuffer, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // Don't fail; continue without photo
      }

      // Get public URL for photo
      const { data: photoPublicUrl } = supabase.storage
        .from(storageBucketName)
        .getPublicUrl(photoFileName);

      // Step 3: Store face descriptor in user_biometrics
      const { error: bioError } = await supabase.from('user_biometrics').insert({
        user_id: userId,
        face_descriptor: faceDescriptor, // pgvector will accept array
        photo_url: photoPublicUrl.publicUrl,
        photo_storage_path: photoFileName,
        verified_at: new Date().toISOString(),
      });

      if (bioError) {
        console.error('Biometric insert error:', bioError);
        // Rollback auth user if biometric fails
        await supabase.auth.admin.deleteUser(userId);
        return NextResponse.json(
          { error: 'Failed to store biometric data' },
          { status: 500 }
        );
      }

      // Step 4: Store farmer profile with mobile
      const { error: farmerError } = await supabase.from('farmers').insert({
        id: userId,
        name,
        mobile,
        location,
        crops,
        created_at: new Date().toISOString(),
        signup_method: 'voice-face', // Track signup method
      });

      if (farmerError) {
        console.error('Farmer insert error:', farmerError);
        await supabase.auth.admin.deleteUser(userId);
        return NextResponse.json(
          { error: 'Failed to create farmer profile' },
          { status: 500 }
        );
      }

      // Step 5: Success! Return user info
      const response = NextResponse.json({
        success: true,
        userId,
        name,
        message: 'Signup successful! You can now login with your face.',
      });

      // Set secure cookie for immediate session
      response.cookies.set('face_auth_user_id', userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;

    } catch (err: any) {
      // Rollback on any error
      await supabase.auth.admin.deleteUser(userId);
      throw err;
    }

  } catch (err: any) {
    console.error('Voice signup error:', err);
    return NextResponse.json(
      { error: 'Signup failed: ' + err.message },
      { status: 500 }
    );
  }
}
