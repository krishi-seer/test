"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface UserProfile {
  name: string;
  age: number;
  location: string;
  username: string;
  avatar_url?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("farmers")
        .select("*")
        .eq("username", session.user.email?.split("@")[0])
        .single();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data) {
        setUser(data as UserProfile);
        setAvatarUrl(data.avatar_url || "");
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(data.path);

      const { error: updateError } = await supabase
        .from("farmers")
        .update({ avatar_url: publicUrl })
        .eq("username", user?.username);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const formatName = (name: string) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-2xl mb-6 backdrop-blur-sm">
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <span className="mr-3 text-4xl">👤</span>
              Profile
            </h1>
            <p className="text-green-100 opacity-90">Loading your profile...</p>
          </div>
          <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-500 mx-auto"></div>
              <p className="mt-6 text-gray-600 font-medium">Loading your data...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-2xl mb-6 backdrop-blur-sm">
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <span className="mr-3 text-4xl">👤</span>
              Profile
            </h1>
            <p className="text-green-100 opacity-90">Please log in to view your profile</p>
          </div>
          
          {/* Login Card */}
          <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-28 h-28 mx-auto bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-14 h-14 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Welcome to Krishi-Seer!</h3>
                <p className="text-gray-600 leading-relaxed">Log in to access your personalized agricultural dashboard and manage your farming data with AI-powered insights.</p>
              </div>
              <div className="space-y-4 pt-4">
                <Button asChild className="w-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 hover:from-green-600 hover:via-blue-600 hover:to-purple-600 text-white py-3 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl">
                  <a href="/login" className="flex items-center justify-center space-x-2">
                    <span className="text-lg">🔑</span>
                    <span className="font-semibold">Log In</span>
                  </a>
                </Button>
                <Button asChild variant="outline" className="w-full border-2 border-green-300 text-green-700 hover:bg-green-50 py-3 rounded-xl transition-all duration-300">
                  <a href="/signup" className="flex items-center justify-center space-x-2">
                    <span className="text-lg">📝</span>
                    <span className="font-semibold">Sign Up</span>
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-2xl mb-6 backdrop-blur-sm">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <span className="mr-3 text-4xl">👤</span>
            Your Profile
          </h1>
          <p className="text-green-100 opacity-90">Manage your agricultural account</p>
        </div>
        
        {/* Profile Card */}
        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl">
          <CardContent className="p-8 space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-28 h-28 rounded-full object-cover border-4 border-gradient-to-r from-green-300 to-blue-300 shadow-xl"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 flex items-center justify-center border-4 border-green-300 shadow-xl">
                    <svg className="w-14 h-14 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full p-2 shadow-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
              </div>
              
              <label className="cursor-pointer bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 hover:from-green-600 hover:via-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <span className="flex items-center space-x-2">
                  <span className="text-lg">{uploading ? "📤" : "📷"}</span>
                  <span>{uploading ? "Uploading..." : "Upload Photo"}</span>
                </span>
              </label>
              
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 w-full">
                  <p className="text-red-600 text-sm text-center font-medium">{error}</p>
                </div>
              )}
            </div>

            {/* Profile Details */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 rounded-xl p-5 border border-green-200/50 shadow-sm">
                <p className="text-sm font-semibold text-gray-500 mb-2 flex items-center">
                  <span className="mr-2 text-lg">👤</span>
                  Full Name
                </p>
                <p className="text-xl font-bold text-gray-800">{formatName(user.name)}</p>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 rounded-xl p-5 border border-green-200/50 shadow-sm">
                <p className="text-sm font-semibold text-gray-500 mb-2 flex items-center">
                  <span className="mr-2 text-lg">🎂</span>
                  Age
                </p>
                <p className="text-xl font-bold text-gray-800">{user.age} years old</p>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 rounded-xl p-5 border border-green-200/50 shadow-sm">
                <p className="text-sm font-semibold text-gray-500 mb-2 flex items-center">
                  <span className="mr-2 text-lg">📍</span>
                  Location
                </p>
                <p className="text-xl font-bold text-gray-800">{formatName(user.location)}</p>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 rounded-xl p-5 border border-green-200/50 shadow-sm">
                <p className="text-sm font-semibold text-gray-500 mb-2 flex items-center">
                  <span className="mr-2 text-lg">🏷️</span>
                  Username
                </p>
                <p className="text-xl font-bold text-gray-800">@{user.username}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <Button asChild className="w-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 hover:from-green-600 hover:via-blue-600 hover:to-purple-600 text-white py-3 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl">
                <a href="/dashboard" className="flex items-center justify-center space-x-2">
                  <span className="text-lg">📊</span>
                  <span className="font-semibold">Go to Dashboard</span>
                </a>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => supabase.auth.signOut()}
                className="w-full border-2 border-red-300 text-red-600 hover:bg-red-50 py-3 rounded-xl transition-all duration-300 font-semibold"
              >
                <span className="flex items-center justify-center space-x-2">
                  <span className="text-lg">🚪</span>
                  <span>Log Out</span>
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
