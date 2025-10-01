"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

const FertilizerPage = () => {
  const { t } = useTranslation();
  const [soilTest, setSoilTest] = useState({
    N: 45, P: 30, K: 60, pH: 6.2, organic: 1.8
  });
  const [cropType, setCropType] = useState("rice");
  const [cropStage, setCropStage] = useState("vegetative");
  const [targetYield, setTargetYield] = useState(50);
  const [fieldSize, setFieldSize] = useState(1);

  // Labels for the form fields
  const formLabels = {
    soilTest: t('fertilizer_soil_test'),
    cropType: t('fertilizer_crop_type'),
    cropStage: t('fertilizer_crop_stage'),
    targetYield: t('fertilizer_target_yield'),
    fieldSize: t('fertilizer_field_size'),
    generate: t('fertilizer_generate')
  };
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [scheduleGenerated, setScheduleGenerated] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const email = sessionData?.session?.user?.email;
        const userIdFromSession = sessionData?.session?.user?.id;
        setUserId(userIdFromSession || null);
        
        if (email) {
          const username = email.split("@")[0];
          const { data } = await supabase.from("farmers").select("name").eq("username", username).maybeSingle();
          setUserName(data?.name || username || "Farmer");
        }
      } catch {
        setUserName("Guest");
      }
    };
    loadUserData();
  }, []);

  const getOptimalNPK = () => {
    const crops: Record<string, Record<string, {N: number, P: number, K: number}>> = {
      rice: { 
        vegetative: { N: 80, P: 40, K: 60 },
        flowering: { N: 60, P: 60, K: 80 },
        maturity: { N: 20, P: 40, K: 60 }
      },
      wheat: {
        vegetative: { N: 100, P: 50, K: 40 },
        flowering: { N: 80, P: 70, K: 60 },
        maturity: { N: 30, P: 50, K: 40 }
      },
      maize: {
        vegetative: { N: 120, P: 60, K: 80 },
        flowering: { N: 100, P: 80, K: 100 },
        maturity: { N: 40, P: 60, K: 80 }
      },
      cotton: {
        vegetative: { N: 110, P: 50, K: 70 },
        flowering: { N: 90, P: 70, K: 90 },
        maturity: { N: 40, P: 50, K: 70 }
      },
      sugarcane: {
        vegetative: { N: 150, P: 60, K: 100 },
        flowering: { N: 120, P: 80, K: 120 },
        maturity: { N: 60, P: 60, K: 100 }
      }
    };
    
    return crops[cropType]?.[cropStage] || crops.rice.vegetative;
  };

  const optimal = getOptimalNPK();
  const deficiency = {
    N: Math.max(0, optimal.N - soilTest.N),
    P: Math.max(0, optimal.P - soilTest.P),
    K: Math.max(0, optimal.K - soilTest.K)
  };

  const getFertilizerRecommendation = () => {
    const recommendations = [];
    
    if (deficiency.N > 0) {
      const ureaNeeded = Math.round((deficiency.N * 2.17) / 10) * 10; // Round to nearest 10
      recommendations.push({
        type: "Urea (46% N)",
        amount: `${ureaNeeded} kg/acre`,
        timing: cropStage === "vegetative" ? "Apply in 2 splits" : "Single application",
        priority: "high"
      });
    }
    
    if (deficiency.P > 0) {
      const dapNeeded = Math.round((deficiency.P * 2.17) / 10) * 10;
      recommendations.push({
        type: "DAP (18-46-0)",
        amount: `${dapNeeded} kg/acre`,
        timing: "Basal application",
        priority: "medium"
      });
    }
    
    if (deficiency.K > 0) {
      const mopNeeded = Math.round((deficiency.K * 1.67) / 10) * 10;
      recommendations.push({
        type: "MOP (60% K2O)",
        amount: `${mopNeeded} kg/acre`,
        timing: "Split with nitrogen",
        priority: "medium"
      });
    }

    if (soilTest.pH < 6.0) {
      recommendations.push({
        type: "Lime",
        amount: "200-300 kg/acre",
        timing: "Before planting",
        priority: "high"
      });
    }

    if (soilTest.organic < 1.5) {
      recommendations.push({
        type: "Organic Compost",
        amount: "1-2 tonnes/acre",
        timing: "Before planting",
        priority: "medium"
      });
    }

    return recommendations;
  };

  const recommendations = getFertilizerRecommendation();
  const costEstimate = recommendations.reduce((total, rec) => {
    const costs: Record<string, number> = {
      "Urea (46% N)": 6,
      "DAP (18-46-0)": 24,
      "MOP (60% K2O)": 18,
      "Lime": 3,
      "Organic Compost": 8
    };
    const amount = parseInt(rec.amount) || 0;
    return total + (amount * (costs[rec.type] || 0));
  }, 0);

  const generatePurchaseList = () => {
    const purchaseList = {
      farmer: userName,
      date: new Date().toLocaleDateString(),
      cropType: cropType,
      cropStage: cropStage,
      fieldSize: `${fieldSize} acres`,
      soilAnalysis: soilTest,
      recommendations: recommendations,
      totalCost: costEstimate,
      expectedROI: "300-400%",
      vendor: "Contact local agricultural supplier"
    };

    const listText = `
# Fertilizer Purchase List - ${userName}

**Date:** ${purchaseList.date}
**Crop:** ${purchaseList.cropType} (${purchaseList.cropStage} stage)
**Field Size:** ${purchaseList.fieldSize}

## Soil Analysis Results
- Nitrogen (N): ${soilTest.N} kg/acre
- Phosphorus (P): ${soilTest.P} kg/acre
- Potassium (K): ${soilTest.K} kg/acre
- pH Level: ${soilTest.pH}
- Organic Matter: ${soilTest.organic}%

## Required Fertilizers
${recommendations.map(rec => `
### ${rec.type}
- **Amount:** ${rec.amount}
- **Application:** ${rec.timing}
- **Priority:** ${rec.priority.toUpperCase()}
`).join('')}

## Cost Summary
- **Total Estimated Cost:** ₹${costEstimate}
- **Expected ROI:** ${purchaseList.expectedROI}
- **Yield Increase Expected:** 4-6%

## Purchase Instructions
1. Contact your local agricultural supplier
2. Show this list for exact quantities
3. Verify fertilizer quality and expiry dates
4. Follow application timing recommendations

---
Generated by Krishi-Seer Fertilizer Optimization Engine
    `;

    const blob = new Blob([listText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fertilizer-purchase-list-${userName}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const scheduleApplication = async () => {
    if (!userId) {
      alert("Please log in to schedule applications");
      return;
    }

    try {
      const scheduleData = {
        user_id: userId,
        crop_type: cropType,
        crop_stage: cropStage,
        field_size: fieldSize,
        soil_analysis: soilTest,
        recommendations: recommendations,
        total_cost: costEstimate,
        application_dates: recommendations.map((rec, index) => ({
          fertilizer: rec.type,
          amount: rec.amount,
          timing: rec.timing,
          scheduled_date: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000).toISOString()
        })),
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from("fertilizer_schedules").insert([scheduleData]);
      
      if (error) {
        console.error("Error scheduling application:", error);
        alert("Error scheduling application. Please try again.");
      } else {
        setScheduleGenerated(true);
        alert("Fertilizer application scheduled successfully!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error scheduling application. Please try again.");
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-1">Fertilizer Optimization</h1>
        <p className="text-green-100">Precision nutrition for 4-6% yield increase</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800">Soil Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Crop Type</label>
                  <select 
                    value={cropType} 
                    onChange={(e) => setCropType(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="rice">Rice/Paddy</option>
                    <option value="wheat">Wheat</option>
                    <option value="maize">Maize</option>
                    <option value="cotton">Cotton</option>
                    <option value="sugarcane">Sugarcane</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Growth Stage</label>
                  <select 
                    value={cropStage} 
                    onChange={(e) => setCropStage(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="vegetative">Vegetative</option>
                    <option value="flowering">Flowering</option>
                    <option value="maturity">Maturity</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Field Size (acres)</label>
                  <input 
                    type="number" 
                    value={fieldSize} 
                    onChange={(e) => setFieldSize(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    min="0.1"
                    step="0.1"
                  />
                </div>
                {userName && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Farmer</label>
                    <input 
                      type="text" 
                      value={userName}
                      readOnly
                      className="w-full border border-gray-300 rounded px-3 py-2 bg-blue-50 text-blue-700 font-semibold"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {(['N', 'P', 'K'] as const).map((nutrient) => (
                  <div key={nutrient}>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{nutrient} (kg/acre)</span>
                      <span className={`font-bold ${
                        soilTest[nutrient] < optimal[nutrient] ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {soilTest[nutrient]} / {optimal[nutrient]}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          soilTest[nutrient] < optimal[nutrient] ? 'bg-red-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, (soilTest[nutrient] / optimal[nutrient]) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">pH Level</div>
                  <div className="text-lg font-bold">{soilTest.pH}</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Organic Matter</div>
                  <div className="text-lg font-bold">{soilTest.organic}%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800">AI Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.length > 0 ? recommendations.map((rec, index) => (
                <div key={index} className={`p-3 rounded-lg border ${
                  rec.priority === 'high' ? 'bg-red-50 border-red-200' :
                  'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{rec.type}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {rec.priority}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>📦 Amount: {rec.amount}</div>
                    <div>⏰ Timing: {rec.timing}</div>
                  </div>
                </div>
              )) : (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                  <span className="text-green-700 font-medium">
                    ✅ Soil nutrition is optimal!
                  </span>
                </div>
              )}
            </div>

            {recommendations.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Estimated Cost</span>
                  <span className="text-lg font-bold text-blue-600">₹{costEstimate}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Expected ROI: 300-400% from yield increase
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Button 
          onClick={generatePurchaseList}
          className="flex-1 bg-green-500 hover:bg-green-600"
        >
          📋 Generate Purchase List
        </Button>
        <Button 
          onClick={scheduleApplication}
          variant="outline" 
          className={`flex-1 ${scheduleGenerated ? 'border-green-500 text-green-700' : ''}`}
          disabled={!userId}
        >
          {scheduleGenerated ? '✓ Schedule Set' : '📅 Schedule Application'}
        </Button>
      </div>
      
      {!userId && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <span className="text-yellow-800 text-sm">
            💡 Please <a href="/login" className="underline font-medium">log in</a> to schedule applications and save your fertilizer plans.
          </span>
        </div>
      )}
    </div>
  );
};

export default FertilizerPage;