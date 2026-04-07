import { NextRequest } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

/**
 * POST /api/alerts/broadcast
 *
 * Automated Multilingual Alert Engine:
 * 1. Takes scheme details and target language (Hindi/Odia/English).
 * 2. Uses LLM to generate a compelling WhatsApp/Voice alert script.
 * 3. Sends the alert via Twilio WhatsApp API (if configured).
 */
export async function POST(req: NextRequest) {
  try {
    const { scheme, language = "hindi", phoneNumbers = [] } = await req.json();

    if (!scheme) {
      return Response.json({ error: "Scheme details required" }, { status: 400 });
    }

    // Step 1: Generate Multilingual Script
    const scriptRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
            content: `You are an expert communicator for Indian farmers. 
            Create a very short, exciting WhatsApp alert (max 160 chars) about a new government scheme. 
            Language: ${language}.
            Include the scheme name and a quick call-to-action to check "Krishi Seer" for details. 
            Return ONLY the script text.`
          },
          {
            role: "user",
            content: `Scheme: ${scheme.name}. Description: ${scheme.description}. Language: ${language}.`
          }
        ],
        temperature: 0.5
      }),
    });

    const scriptText = (await scriptRes.json()).choices[0].message.content;

    // Step 2: Send via Twilio (Logic implementation)
    const sendResults = [];
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
      for (const phone of phoneNumbers) {
        try {
          const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
          const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
            method: "POST",
            headers: {
              "Authorization": `Basic ${auth}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              To: `whatsapp:${phone}`,
              From: TWILIO_WHATSAPP_FROM,
              Body: scriptText
            })
          });
          sendResults.push({ phone, success: res.ok });
        } catch (err: any) {
          sendResults.push({ phone, success: false, error: err.message });
        }
      }
    } else {
      console.log("Twilio not configured. Alert script generated:", scriptText);
    }

    return Response.json({
      success: true,
      script: scriptText,
      results: sendResults,
      notConfigured: !TWILIO_ACCOUNT_SID
    });

  } catch (err: any) {
    return Response.json({ error: err?.message || "Alert failed" }, { status: 500 });
  }
}
