import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface FaceEmbeddingRequest {
  embedding: number[];
  threshold?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body: FaceEmbeddingRequest = await req.json();

    // Validate input
    if (!body.embedding || !Array.isArray(body.embedding) || body.embedding.length !== 128) {
      return NextResponse.json(
        { error: 'Invalid embedding: must be an array of 128 numbers' },
        { status: 400 }
      );
    }

    // Validate that all values are numbers
    if (!body.embedding.every(val => typeof val === 'number' && !isNaN(val))) {
      return NextResponse.json(
        { error: 'Invalid embedding: all values must be valid numbers' },
        { status: 400 }
      );
    }

    // Convert embedding array to PostgreSQL vector format
    const embeddingVector = `[${body.embedding.join(',')}]`;
    const threshold = body.threshold || 0.42;

    // Call the RPC function to find closest match
    const { data, error } = await supabaseAdmin.rpc('find_closest_profile_by_embedding', {
      input_embedding: embeddingVector,
      distance_threshold: threshold
    });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Database query failed', details: error.message },
        { status: 500 }
      );
    }

    // Return the match result
    if (data && data.length > 0) {
      return NextResponse.json({
        success: true,
        match: data[0],
        message: 'Face match found'
      });
    } else {
      return NextResponse.json({
        success: false,
        match: null,
        message: 'No matching face found'
      });
    }

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}