"use client";
import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DemoPage = () => {
  const { t } = useTranslation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Replace this with your actual video file name in the public folder
  const videoUrl = "/demo-video.mp4"; // Your video should be at: d:\krishi-seer\public\demo-video.mp4
  const youtubeId = "YOUR_YOUTUBE_VIDEO_ID"; // Replace with your YouTube video ID if using YouTube
  const vimeoId = "YOUR_VIMEO_VIDEO_ID"; // Replace with your Vimeo video ID if using Vimeo

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };

  // Listen for fullscreen changes
  if (typeof window !== "undefined") {
    document.addEventListener("fullscreenchange", handleFullscreenChange);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <h1 className="text-3xl font-bold mb-2">🎥 Krishi-Seer Demo Video</h1>
          <p className="text-green-100">
            Watch how our AI-powered agricultural platform helps farmers achieve 10%+ yield increase
          </p>
        </div>

        {/* Video Section */}
        <div className="space-y-4">
          {/* Video Container */}
          <Card className="border-none shadow-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="relative bg-black">
                {/* Option 1: Direct Video File Upload */}
                <video
                  ref={videoRef}
                  className="w-full h-auto min-h-[400px] md:min-h-[600px]"
                  controls
                  poster="/thumbnail.jpeg" // Thumbnail image for video preview
                  preload="metadata"
                >
                  <source src={videoUrl} type="video/mp4" />
                  <source src="/demo-video.webm" type="video/webm" />
                  Your browser does not support the video tag.
                </video>

                {/* Option 2: YouTube Embed (uncomment to use) */}
                {/*
                <div className="relative pb-[56.25%] h-0 overflow-hidden">
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&rel=0&modestbranding=1`}
                    title="Krishi-Seer Demo Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
                */}

                {/* Option 3: Vimeo Embed (uncomment to use) */}
                {/*
                <div className="relative pb-[56.25%] h-0 overflow-hidden">
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={`https://player.vimeo.com/video/${vimeoId}?autoplay=0&title=0&byline=0&portrait=0`}
                    title="Krishi-Seer Demo Video"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
                */}

                {/* Fullscreen Button */}
                <button
                  onClick={toggleFullscreen}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-all duration-200"
                  title="Toggle Fullscreen"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Video Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800">📊 Demo Highlights</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-3">
                    <span className="text-green-500">✓</span>
                    <span>Smart Irrigation Scheduler in action</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span className="text-green-500">✓</span>
                    <span>AI-powered Fertilizer Optimization</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span className="text-green-500">✓</span>
                    <span>Crop Disease Detection & Treatment</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span className="text-green-500">✓</span>
                    <span>Multilingual Support (Hindi/English/Odia)</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span className="text-green-500">✓</span>
                    <span>Weather-based Yield Predictions</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span className="text-green-500">✓</span>
                    <span>Market Intelligence Dashboard</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800">🎯 Key Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="font-semibold text-green-800">10%+ Yield Increase</div>
                    <div className="text-sm text-gray-600">Through precision agriculture</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="font-semibold text-blue-800">300-400% ROI</div>
                    <div className="text-sm text-gray-600">On fertilizer optimization</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="font-semibold text-purple-800">Real-time Analysis</div>
                    <div className="text-sm text-gray-600">AI-powered recommendations</div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="font-semibold text-orange-800">Regional Language</div>
                    <div className="text-sm text-gray-600">Support for local farmers</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <Card className="border-none shadow-md bg-gradient-to-r from-green-50 to-blue-50">
            <CardContent className="p-6 text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Ready to Transform Your Farming? 🌾
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Join thousands of farmers already using Krishi-Seer to optimize their agricultural practices 
                and achieve higher yields through AI-powered insights.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="bg-green-500 hover:bg-green-600 text-white">
                  <a href="/dashboard">Start Using Platform</a>
                </Button>
                <Button asChild variant="outline" className="border-green-300 text-green-700">
                  <a href="/contact">Contact Developer</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;