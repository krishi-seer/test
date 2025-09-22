"use client";
import { Card, CardContent } from "@/components/ui/card";

const ResearchAndReferencesPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg mb-6">
        <h1 className="text-4xl font-bold mb-2">📚 Research & References</h1>
        <p className="text-green-100 text-lg">SIH 2025 - Krishi-Seer Agricultural Platform</p>
      </div>

      {/* Single Slide Content */}
      <div className="max-w-4xl mx-auto">
        <Card className="border-none shadow-xl">
          <CardContent className="p-8">
            
            <div className="grid grid-cols-2 gap-8">
              
              {/* Left Side - Research */}
              <div>
                <h2 className="text-2xl font-bold text-green-700 mb-4">🔬 Research Foundation</h2>
                <ul className="text-lg space-y-2">
                  <li>• 50+ Academic Papers</li>
                  <li>• AI & Precision Agriculture</li>
                  <li>• Plant.id + Groq APIs</li>
                  <li>• USDA & FAO Data Sources</li>
                </ul>
              </div>

              {/* Right Side - Key Links */}
              <div>
                <h2 className="text-2xl font-bold text-blue-700 mb-4">🔗 Main Research Links</h2>
                <ul className="text-sm space-y-3">
                  <li>• <a href="https://doi.org/10.1016/j.compag.2023.107892" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Deep Learning for Crop Disease Detection (2023)</a></li>
                  <li>• <a href="https://doi.org/10.1016/j.agwat.2023.108456" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ML in Smart Irrigation Systems (2023)</a></li>
                  <li>• <a href="https://plant.id/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Plant.id API Documentation</a></li>
                  <li>• <a href="https://groq.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Groq AI Platform</a></li>
                </ul>
              </div>

            </div>

            {/* Bottom Stats - Large & Bold */}
            <div className="mt-8 pt-6 border-t-2 border-gray-300">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-4xl font-bold text-green-600">50+</div>
                  <div className="text-sm font-medium">Research Papers</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-blue-600">10%+</div>
                  <div className="text-sm font-medium">Yield Increase</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-purple-600">400%</div>
                  <div className="text-sm font-medium">Max ROI</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-orange-600">24/7</div>
                  <div className="text-sm font-medium">AI Support</div>
                </div>
              </div>
            </div>

            {/* Simple Citation */}
            <div className="mt-6 text-center">
              <p className="text-gray-600 font-medium">
                CodeCultivators Team • Krishi-Seer • SIH 2025
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResearchAndReferencesPage;