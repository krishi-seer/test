import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    // Test database connection and table structure
    const { data, error } = await supabase
      .from("farmers")
      .select("*")
      .limit(5);
      
    if (error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message,
          details: error 
        }), 
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        count: data?.length || 0,
        farmers: data,
        message: "Database connection successful"
      }), 
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error"
      }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, age, location, username, email } = body;
    
    if (!name || !username || !email) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required fields: name, username, email" 
        }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Insert test farmer
    const { data, error } = await supabase.from("farmers").insert({
      name,
      age: age ? parseInt(age) : null,
      location: location || "Test Location",
      username,
      email,
      created_at: new Date().toISOString()
    }).select();
    
    if (error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message,
          details: error 
        }), 
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        farmer: data[0],
        message: "Test farmer created successfully"
      }), 
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error"
      }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}