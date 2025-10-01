import { NextRequest } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const HUGGING_FACE_TOKEN = process.env.HUGGING_FACE_TOKEN;

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { messages, language } = await req.json();
    const lang = typeof language === "string" ? language : "en";

  const sys = `You are Krishi‑Seer's agricultural AI assistant, specialized in helping farmers with crop management, weather insights, disease identification, government schemes, and agricultural best practices. 

Context about Krishi-Seer platform:
- Features: Crop Advisory (disease & species identification), Weather & Air Quality monitoring, Government Schemes finder, Community support, Voice Assistant, AI Chatbot
- Target users: Farmers, agricultural advisors, rural communities in India
- Multilingual support: English, Hindi, Odia
- Core services: Plant identification, weather forecasting, soil health monitoring, market price analysis

Your responses should:
- Be practical and actionable for farmers
- Consider Indian agricultural practices and crops
- Provide specific advice based on regional conditions when possible
- Reference relevant government schemes when appropriate
- Reply in the user's language (${lang})
- Be encouraging and supportive
- Include seasonal considerations for farming activities

If asked about anything outside agriculture, politely redirect the user to farming topics and do not answer non-agricultural questions.

Always prioritize farmer safety and sustainable agricultural practices.`;
    
    const history = Array.isArray(messages) ? messages.slice(-8) : [];
    const lastUserMessage = history[history.length - 1]?.content || "";

    // Try Groq first (fastest and reliable), then OpenAI, then Hugging Face, then rule-based
    let responseText = "";
    let useStreaming = false;
    if (GROQ_API_KEY) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${GROQ_API_KEY}` 
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            stream: true,
            messages: [{ role: "system", content: sys }, ...history],
            temperature: 0.3,
            max_tokens: 250,
          }),
        });

        if (res.ok && res.body) {
          useStreaming = true;
          const encoder = new TextEncoder();
          const reader = res.body.getReader();
          const stream = new ReadableStream({
            async pull(controller) {
              const { done, value } = await reader.read();
              if (done) {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                return controller.close();
              }
              controller.enqueue(value);
            },
            cancel() { reader.cancel(); },
          });
          return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
        }
      } catch (error) {
        console.log("Groq failed, trying OpenAI...", error);
      }
    }

    // Try OpenAI as backup
    if (OPENAI_API_KEY) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            stream: true,
            messages: [{ role: "system", content: sys }, ...history],
            temperature: 0.3,
            max_tokens: 250,
          }),
        });

        if (res.ok && res.body) {
          useStreaming = true;
          const encoder = new TextEncoder();
          const reader = res.body.getReader();
          const stream = new ReadableStream({
            async pull(controller) {
              const { done, value } = await reader.read();
              if (done) {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                return controller.close();
              }
              controller.enqueue(value);
            },
            cancel() { reader.cancel(); },
          });
          return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
        }
      } catch (error) {
        console.log("OpenAI failed, trying Hugging Face...");
      }
    }

    // Try Hugging Face if OpenAI fails
    if (HUGGING_FACE_TOKEN && !useStreaming) {
      try {
        const res = await fetch("https://api-inference.huggingface.co/models/microsoft/DialoGPT-large", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${HUGGING_FACE_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: `Agricultural Assistant: ${lastUserMessage}`,
            parameters: {
              max_length: 200,
              temperature: 0.7,
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          responseText = data[0]?.generated_text?.replace(`Agricultural Assistant: ${lastUserMessage}`, '').trim() || "";
        }
      } catch (error) {
        console.log("Hugging Face failed, using rule-based fallback...");
      }
    }

    // Rule-based fallback
    if (!responseText) {
      const lower = lastUserMessage.toLowerCase();
      const isHi = lang.startsWith("hi");
      const isOr = lang.startsWith("or");

      const EN_RESPONSES = {
        crop: "For crop management, consider soil testing, proper irrigation, and organic fertilizers. Which specific crop are you growing?",
        weather: "Weather monitoring is crucial for farming. Check local forecasts and plan irrigation accordingly. Would you like current weather updates?",
        disease: "Plant diseases can be identified by symptoms like yellowing, spots, or wilting. Upload a photo in our Advisory section for detailed analysis.",
        fertilizer: "Use balanced NPK fertilizers based on soil test results. Organic options include compost, vermicompost, and green manure.",
        water: "Efficient water management includes drip irrigation, mulching, and rainwater harvesting. What's your current irrigation method?",
        pest: "Integrated Pest Management (IPM) combines biological, cultural, and chemical controls. Early detection is key.",
        scheme: "Government schemes like PM-KISAN, Soil Health Card, and crop insurance are available. Check our Schemes section for details.",
        generic: "I'm here to help with your farming questions! Ask about crops, weather, diseases, fertilizers, government schemes, or any agricultural topic."
      };

      const HI_RESPONSES = {
        crop: "फसल प्रबंधन के लिए मिट्टी की जांच, उचित सिंचाई और जैविक उर्वरक का उपयोग करें। आप कौन सी फसल उगा रहे हैं?",
        weather: "खेती के लिए मौसम की निगरानी महत्वपूर्ण है। स्थानीय पूर्वानुमान देखें और सिंचाई की योजना बनाएं।",
        disease: "पौधों की बीमारियों की पहचान पीलापन, धब्बे या मुरझाने से होती है। विस्तृत विश्लेषण के लिए हमारे सलाह विभाग में फोटो अपलोड करें।",
        fertilizer: "मिट्टी परीक्षण के आधार पर संतुलित NPK उर्वरक का उपयोग करें। जैविक विकल्पों में कंपोस्ट और वर्मीकंपोस्ट शामिल हैं।",
        water: "कुशल जल प्रबंधन में ड्रिप सिंचाई, मल्चिंग और वर्षा जल संचयन शामिल है।",
        pest: "एकीकृत कीट प्रबंधन (IPM) जैविक, सांस्कृतिक और रासायनिक नियंत्रण को जोड़ता है।",
        scheme: "PM-किसान, सॉइल हेल्थ कार्ड और फसल बीमा जैसी सरकारी योजनाएं उपलब्ध हैं।",
        generic: "मैं आपके खेती के सवालों में मदद के लिए यहां हूं! फसल, मौसम, बीमारी, उर्वरक या किसी भी कृषि विषय के बारे में पूछें।"
      };

      const responses = isHi ? HI_RESPONSES : EN_RESPONSES;
      
      if (/crop|farming|खेती|फसल/.test(lower)) responseText = responses.crop;
      else if (/weather|rain|मौसम|बारिश/.test(lower)) responseText = responses.weather;
      else if (/disease|pest|बीमारी|कीट/.test(lower)) responseText = responses.disease;
      else if (/fertilizer|उर्वरक/.test(lower)) responseText = responses.fertilizer;
      else if (/water|irrigation|पानी|सिंचाई/.test(lower)) responseText = responses.water;
      else if (/scheme|योजना/.test(lower)) responseText = responses.scheme;
      else responseText = responses.generic;
    }

    // Stream the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const words = responseText.split(' ');
        let index = 0;
        
        const interval = setInterval(() => {
          if (index < words.length) {
            const word = words[index] + (index < words.length - 1 ? ' ' : '');
            controller.enqueue(encoder.encode("data: " + JSON.stringify({ delta: word }) + "\n\n"));
            index++;
          } else {
            clearInterval(interval);
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          }
        }, 50);
      },
    });

    return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
  } catch (err: any) {
    console.error("Chat stream error:", err);
    return new Response(JSON.stringify({ error: err?.message || "Unexpected error" }), { status: 500 });
  }
}


