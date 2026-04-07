/**
 * sources.ts — Government scheme data scrapers
 * Fetches public pages, extracts text, uses LLM to normalize into scheme JSON.
 */

export type RawScheme = {
  name: string;
  description: string;
  url: string;
  tags: string[];
  state: string;
  district?: string;
  active: boolean;
};

// Known government scheme source pages
const GOV_SOURCES = [
  {
    id: "agricoop",
    name: "Ministry of Agriculture & Farmers Welfare",
    url: "https://agricoop.nic.in/en/schemes",
    fallbackUrl: "https://agricoop.gov.in/en/schemes",
  },
  {
    id: "pmkisan",
    name: "PM-KISAN Portal",
    url: "https://pmkisan.gov.in",
    fallbackUrl: "https://pmkisan.gov.in/Home.aspx",
  },
  {
    id: "krishionnati",
    name: "Krishionnati Yojana",
    url: "https://agricoop.nic.in/en/schemes/krishionnati-yojana",
    fallbackUrl: "https://agricoop.gov.in/en/schemes",
  },
  {
    id: "mospi",
    name: "MoSPI e-Sankhyiki",
    url: "https://www.mospi.gov.in/publication/statistical-year-book-india",
    fallbackUrl: "https://www.mospi.gov.in",
  },
];

// Well-known active schemes as a baseline (used when scraping fails)
const KNOWN_SCHEMES: RawScheme[] = [
  {
    name: "PM-KISAN Samman Nidhi",
    description:
      "Direct income support of ₹6,000 per year to eligible farmer families in three equal installments of ₹2,000 each.",
    url: "https://pmkisan.gov.in",
    tags: ["income", "all_crops", "central"],
    state: "all",
    active: true,
  },
  {
    name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    description:
      "Crop insurance scheme providing financial support to farmers suffering crop loss due to natural calamities, pests, and diseases.",
    url: "https://pmfby.gov.in",
    tags: ["insurance", "wheat", "rice", "maize", "all_crops", "central"],
    state: "all",
    active: true,
  },
  {
    name: "Soil Health Card Scheme",
    description:
      "Provides soil health cards to farmers with crop-wise nutrient recommendations for improving productivity through judicious use of inputs.",
    url: "https://soilhealth.dac.gov.in",
    tags: ["soil", "fertilizer", "central"],
    state: "all",
    active: true,
  },
  {
    name: "Krishionnati Yojana",
    description:
      "Umbrella scheme for holistic development of agriculture including Mission for Integrated Development of Horticulture (MIDH) and National Food Security Mission (NFSM).",
    url: "https://agricoop.nic.in/en/schemes/krishionnati-yojana",
    tags: ["wheat", "rice", "maize", "horticulture", "central"],
    state: "all",
    active: true,
  },
  {
    name: "Paramparagat Krishi Vikas Yojana (PKVY)",
    description:
      "Promotes organic farming through adoption of organic village clusters. Farmers receive ₹50,000/ha over 3 years for organic inputs and certification.",
    url: "https://pgsindia-ncof.gov.in/pkvy/index.aspx",
    tags: ["organic", "soil", "central"],
    state: "all",
    active: true,
  },
  {
    name: "Micro Irrigation Fund (MIF)",
    description:
      "Facilitates micro irrigation (drip and sprinkler) with subsidies up to 55% for small farmers to improve water use efficiency.",
    url: "https://pmksy.gov.in",
    tags: ["irrigation", "water", "central"],
    state: "all",
    active: true,
  },
  {
    name: "National Mission on Oilseeds and Oil Palm (NMOOP)",
    description:
      "Aims to increase production of oilseeds and oil palm through area expansion, productivity improvement, and seed distribution.",
    url: "https://agricoop.nic.in/en/schemes/nmoop",
    tags: ["mustard", "oilseed", "central"],
    state: "all",
    active: true,
  },
  {
    name: "Kalia Yojana (Odisha)",
    description:
      "Krushak Assistance for Livelihood and Income Augmentation — provides ₹10,000 per family for small/marginal farmers in Odisha for cultivation assistance.",
    url: "https://kalia.odisha.gov.in",
    tags: ["income", "rice", "all_crops"],
    state: "odisha",
    active: true,
  },
  {
    name: "Mukhyamantri Krishi Ashirwad Yojana (Jharkhand)",
    description:
      "Provides ₹5,000 per acre (up to 5 acres) to small and marginal farmers for Kharif crop cultivation.",
    url: "https://mmkay.jharkhand.gov.in",
    tags: ["income", "rice", "wheat"],
    state: "jharkhand",
    active: true,
  },
  {
    name: "UP Krishi Yantra Subsidy Yojana",
    description:
      "Provides 50% subsidy on agricultural equipment for farmers in Uttar Pradesh including tractors, pump sets, and sprayers.",
    url: "https://upagriculture.com",
    tags: ["equipment", "wheat", "rice", "mustard"],
    state: "up",
    active: true,
  },
  {
    name: "Bihar Krishi Input Subsidy Scheme",
    description:
      "Provides ₹6,800 per hectare for irrigated land and ₹13,500 for rain-fed crop loss due to floods, drought, or hailstorm in Bihar.",
    url: "https://dbtagriculture.bihar.gov.in",
    tags: ["insurance", "wheat", "rice", "maize"],
    state: "bihar",
    active: true,
  },
  {
    name: "e-NAM (National Agriculture Market)",
    description:
      "Pan-India electronic trading portal networking existing APMC mandis to create unified national market for agricultural commodities.",
    url: "https://enam.gov.in",
    tags: ["market", "all_crops", "central"],
    state: "all",
    active: true,
  },
];

/**
 * Try to fetch and extract text from a government source page.
 * Returns raw text content or null if fetch fails.
 */
async function fetchSourceText(url: string, fallbackUrl?: string): Promise<string | null> {
  const tryFetch = async (targetUrl: string): Promise<string | null> => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; KrishiSeer/1.0; Agricultural Data Aggregator)",
          Accept: "text/html,application/xhtml+xml",
        },
      });
      clearTimeout(timeout);

      if (!res.ok) return null;

      const html = await res.text();
      // Strip HTML tags, keep text content
      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 8000); // Limit to 8k chars for LLM context

      return text.length > 100 ? text : null;
    } catch {
      return null;
    }
  };

  const result = await tryFetch(url);
  if (result) return result;
  if (fallbackUrl) return tryFetch(fallbackUrl);
  return null;
}

/**
 * Check if a URL is still live (not 404).
 */
export async function checkUrlAlive(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; KrishiSeer/1.0)",
      },
    });
    clearTimeout(timeout);
    return res.ok || res.status === 301 || res.status === 302;
  } catch {
    return false;
  }
}

/**
 * Use Groq LLM to normalize raw scraped text into scheme JSON.
 */
async function llmNormalize(
  rawText: string,
  sourceName: string,
  groqApiKey: string
): Promise<RawScheme[]> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `You extract Indian government agricultural scheme data from raw website text. Return ONLY a JSON array of schemes. Each scheme object must have: name (string), description (string, 1-2 sentences), url (string), tags (string array from: wheat, rice, maize, mustard, soil, income, insurance, irrigation, fertilizer, organic, equipment, market, horticulture, oilseed, all_crops, central), state (lowercase: "all" for central, or state name like "odisha", "bihar", "up"), active (boolean, true unless explicitly expired). Return [] if no schemes found. No markdown, no explanation, just the JSON array.`,
          },
          {
            role: "user",
            content: `Extract agricultural schemes from this ${sourceName} page content:\n\n${rawText.slice(0, 6000)}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || "";

    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    // Validate shape
    return parsed.filter(
      (s: any) => s.name && typeof s.name === "string" && s.name.length > 3
    ) as RawScheme[];
  } catch {
    return [];
  }
}

/**
 * Main scraper: fetch all sources, normalize with LLM, merge with known baseline.
 */
export async function scrapeAllSources(groqApiKey: string): Promise<{
  schemes: RawScheme[];
  scrapedSources: string[];
  failedSources: string[];
}> {
  const scrapedSources: string[] = [];
  const failedSources: string[] = [];
  const llmSchemes: RawScheme[] = [];

  // Try fetching each government source
  const results = await Promise.allSettled(
    GOV_SOURCES.map(async (source) => {
      const text = await fetchSourceText(source.url, source.fallbackUrl);
      if (text) {
        scrapedSources.push(source.id);
        const normalized = await llmNormalize(text, source.name, groqApiKey);
        return normalized;
      } else {
        failedSources.push(source.id);
        return [];
      }
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      llmSchemes.push(...result.value);
    }
  }

  // Merge: LLM-scraped schemes + known baseline (deduplicated by name similarity)
  const merged = [...KNOWN_SCHEMES];
  for (const scraped of llmSchemes) {
    const exists = merged.some(
      (m) =>
        m.name.toLowerCase().includes(scraped.name.toLowerCase().slice(0, 15)) ||
        scraped.name.toLowerCase().includes(m.name.toLowerCase().slice(0, 15))
    );
    if (!exists) {
      merged.push(scraped);
    }
  }

  return { schemes: merged, scrapedSources, failedSources };
}
