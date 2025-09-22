import { NextRequest } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const HUGGING_FACE_TOKEN = process.env.HUGGING_FACE_TOKEN;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text: string = String(body?.text || "").slice(0, 4000);
    const language: string | undefined = typeof body?.language === "string" ? body.language : undefined;

    // Try Groq first, then OpenAI, then rule-based
    let reply = "";

    // Try Groq API (fast and reliable)
    if (GROQ_API_KEY && !reply) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              {
                role: "system",
                content: `You are Krishi‑Seer's agricultural AI assistant. Provide practical, actionable advice for farmers. Focus on crop management, disease identification, and agricultural best practices. Reply in the user's language if specified: ${language || "auto"}.`
              },
              { role: "user", content: text }
            ],
            temperature: 0.4,
            max_tokens: 300,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          reply = data?.choices?.[0]?.message?.content || "";
        }
      } catch (error) {
        console.log("Groq failed, trying OpenAI...", error);
      }
    }

    // Try OpenAI as backup
    if (OPENAI_API_KEY && !reply) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: `You are Krishi‑Seer's agricultural AI assistant. Reply in language: ${language || "auto"}.` },
              { role: "user", content: text },
            ],
            temperature: 0.4,
            max_tokens: 300,
          }),
        });
        
        if (res.ok) {
          const data = await res.json();
          reply = data?.choices?.[0]?.message?.content || "";
        }
      } catch (error) {
        console.log("OpenAI failed, using rule-based fallback...");
      }
    }

    // Enhanced rule-based fallback with crop-specific responses
    if (!reply) {
      const lower = text.toLowerCase();
      const lang = (language || "en").toLowerCase();
      const isHi = lang.startsWith("hi");
      const isOr = lang.startsWith("or");

      // Enhanced crop analysis responses
      if (/wheat|गेहूं/.test(lower)) {
        reply = isHi 
          ? "गेहूं की फसल स्वस्थ दिख रही है। नियमित सिंचाई करें और रतुआ (rust) रोग से बचाव के लिए निगरानी रखें। फसल में पोषक तत्वों की कमी न हो इसका ध्यान रखें।"
          : "Your wheat crop appears healthy. Maintain regular irrigation and monitor for rust disease. Ensure proper nutrient management for optimal growth.";
      } else if (/rice|धान|चावल/.test(lower)) {
        reply = isHi 
          ? "धान की फसल की स्थिति अच्छी है। पानी का स्तर बनाए रखें और तना छेदक से बचाव करें। खरपतवार नियंत्रण पर ध्यान दें।"
          : "Rice crop condition looks good. Maintain proper water levels and protect against stem borers. Focus on weed control for better yield.";
      } else if (/maize|corn|मक्का/.test(lower)) {
        reply = isHi 
          ? "मक्का की फसल स्वस्थ है। फल लगने के समय पर्याप्त पानी दें। तना छेदक और पत्ती धब्बा रोग से सावधान रहें।"
          : "Maize crop appears healthy. Provide adequate water during tasseling stage. Watch for stem borers and leaf spot diseases.";
      } else if (/cotton|कपास/.test(lower)) {
        reply = isHi 
          ? "कपास की फसल ठीक दिख रही है। सूंडी (bollworm) और माहू (aphids) की निगरानी करें। जल भराव से बचाव करें।"
          : "Cotton crop looks fine. Monitor for bollworms and aphids. Avoid waterlogging for healthy growth.";
      } else if (/tomato|टमाटर/.test(lower)) {
        reply = isHi 
          ? "टमाटर की फसल स्वस्थ है। पछेती झुलसा रोग से बचाव करें। नियमित छिड़काव और जल निकासी का ध्यान रखें।"
          : "Tomato crop is healthy. Prevent late blight disease. Maintain regular spraying schedule and proper drainage.";
      } else if (/potato|आलू/.test(lower)) {
        reply = isHi 
          ? "आलू की फसल अच्छी है। झुलसा रोग और कीड़ों से बचाव करें। मिट्टी चढ़ाने का काम समय पर करें।"
          : "Potato crop is good. Protect from blight and pest attacks. Ensure timely earthing up for better tuber development.";
      } else if (/healthy|स्वस्थ|ठीक/.test(lower)) {
        reply = isHi 
          ? "आपकी फसल स्वस्थ दिख रही है। नियमित देखभाल जारी रखें। सिंचाई, पोषण और कीट नियंत्रण पर ध्यान दें।"
          : "Your crop appears healthy. Continue regular care. Focus on irrigation, nutrition, and pest management.";
      } else if (/disease|बीमारी|रोग/.test(lower)) {
        reply = isHi 
          ? "फसल में कुछ समस्या दिख सकती है। नजदीकी कृषि विशेषज्ञ से सलाह लें। तुरंत उपचार शुरू करें।"
          : "Some issues may be visible in the crop. Consult local agricultural expert. Start treatment immediately.";
      } else {
        reply = isHi 
          ? "फसल की विस्तृत जांच के लिए बेहतर फोटो अपलोड करें। कृषि सलाह के लिए हमारे विशेषज्ञ उपलब्ध हैं।"
          : "Upload a clearer photo for detailed crop analysis. Our agricultural experts are available for advice.";
      }
    }

    return new Response(JSON.stringify({ reply }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });
    
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Unexpected error" }), { status: 500 });
  }
}


