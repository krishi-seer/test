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
    id: "agriwelfare",
    name: "Ministry of Agriculture & Farmers Welfare (Main)",
    url: "https://agriwelfare.gov.in/en/Schemes",
    fallbackUrl: "https://agricoop.nic.in/en/schemes",
  },
  {
    id: "myscheme_agri",
    name: "myScheme - Agriculture (Central)",
    url: "https://www.myscheme.gov.in/search/category/Agriculture",
  },
  {
    id: "pmkisan",
    name: "PM-KISAN Portal",
    url: "https://pmkisan.gov.in",
  },
  {
    id: "dbt_bihar",
    name: "Bihar DBT Agriculture",
    url: "https://dbtagriculture.bihar.gov.in",
  },
  {
    id: "agri_odisha",
    name: "Odisha Agriculture Portal",
    url: "https://agri.odisha.gov.in",
  },
  {
    id: "up_agri",
    name: "UP Agriculture Portal",
    url: "https://upagriculture.com",
  },
];

// Well-known active schemes as a baseline (used when scraping fails)
const KNOWN_SCHEMES: RawScheme[] = [
  // --- CENTRAL SCHEMES ---
  {
    name: "PM-KISAN Samman Nidhi",
    description: "Direct income support of ₹6,000 per year to eligible farmer families in three equal installments of ₹2,000 each.",
    url: "https://pmkisan.gov.in",
    tags: ["income", "all_crops", "central"],
    state: "all",
    active: true,
  },
  {
    name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    description: "Crop insurance scheme providing financial support to farmers suffering crop loss due to natural calamities, pests, and diseases.",
    url: "https://pmfby.gov.in",
    tags: ["insurance", "all_crops", "central"],
    state: "all",
    active: true,
  },
  {
    name: "Soil Health Card Scheme",
    description: "Provides soil health cards to farmers with crop-wise nutrient recommendations for improving productivity through judicious use of inputs.",
    url: "https://soilhealth.dac.gov.in",
    tags: ["soil", "fertilizer", "central"],
    state: "all",
    active: true,
  },
  {
    name: "Kisan Credit Card (KCC)",
    description: "Timely and affordable short-term credit for crop production and allied activities at subsidized interest rates.",
    url: "https://agriwelfare.gov.in/en/KCC",
    tags: ["income", "market", "central"],
    state: "all",
    active: true,
  },
  {
    name: "Paramparagat Krishi Vikas Yojana (PKVY)",
    description: "Promotes organic farming through cluster-based approaches and financial assistance for organic inputs and certification.",
    url: "https://pkvy.org",
    tags: ["organic", "soil", "central"],
    state: "all",
    active: true,
  },
  {
    name: "PM Krishi Sinchayee Yojana (PMKSY)",
    description: "Focuses on 'More Crop Per Drop' through micro-irrigation (drip/sprinkler) to enhance water-use efficiency.",
    url: "https://pmksy.gov.in",
    tags: ["irrigation", "water", "central"],
    state: "all",
    active: true,
  },
  {
    name: "Agriculture Infrastructure Fund (AIF)",
    description: "Financing for post-harvest infrastructure like cold storage and warehouses with 3% interest subvention.",
    url: "https://agriinfra.dac.gov.in",
    tags: ["market", "infrastructure", "central"],
    state: "all",
    active: true,
  },
  {
    name: "National Food Security Mission (NFSM)",
    description: "Aims to increase production of rice, wheat, and pulses through area expansion and productivity improvement.",
    url: "https://nfsm.gov.in",
    tags: ["wheat", "rice", "central"],
    state: "all",
    active: true,
  },
  {
    name: "Nutri-Cereals Mission (Millets)",
    description: "Promotes production and consumption of millets (Jowar, Bajra, Ragi) for nutritional security and farmer income.",
    url: "https://agriwelfare.gov.in",
    tags: ["maize", "all_crops", "central"],
    state: "all",
    active: true,
  },
  {
    name: "Rainfed Area Development (RAD)",
    description: "Focuses on integrated farming systems (Crops + Livestock/Trees) in rainfed areas to mitigate climate risks.",
    url: "https://nmsa.dac.gov.in",
    tags: ["soil", "all_crops", "central"],
    state: "all",
    active: true,
  },
  {
    name: "PM-PRANAM Scheme",
    description: "Innovative incentive scheme for states to promote balanced fertilizer use and reduce chemical fertilizer consumption.",
    url: "https://fert.nic.in",
    tags: ["fertilizer", "soil", "central"],
    state: "all",
    active: true,
  },
  {
    name: "e-NAM (National Agriculture Market)",
    description: "Unified national market for agricultural commodities through an electronic trading portal networking APMC mandis.",
    url: "https://enam.gov.in",
    tags: ["market", "all_crops", "central"],
    state: "all",
    active: true,
  },
  {
    name: "Digital Agriculture Mission",
    description: "Integration of AI, IoT, and data analytics for precision farming and digital crop estimation.",
    url: "https://agriwelfare.gov.in",
    tags: ["market", "all_crops", "central"],
    state: "all",
    active: true,
  },

  // --- ODISHA SCHEMES ---
  {
    name: "KALIA Scheme (Odisha)",
    description: "Krushak Assistance for Livelihood and Income Augmentation — financial support for small/marginal farmers.",
    url: "https://kalia.odisha.gov.in",
    tags: ["income", "rice", "all_crops"],
    state: "odisha",
    active: true,
  },
  {
    name: "BALARAM Scheme (Odisha)",
    description: "Provides collateral-free farm loans to landless sharecroppers and tenant farmers through Joint Liability Groups.",
    url: "https://agri.odisha.gov.in",
    tags: ["income", "market", "rice"],
    state: "odisha",
    active: true,
  },
  {
    name: "Odisha Millet Mission",
    description: "Promotion of millet cultivation, processing, and marketing to improve nutrition and local economies.",
    url: "https://millets.odisha.gov.in",
    tags: ["maize", "all_crops"],
    state: "odisha",
    active: true,
  },
  {
    name: "Krushi Yantra Subsidy (Odisha)",
    description: "Subsidies for agricultural machinery like tractors, power tillers, and pump sets for Odisha farmers.",
    url: "https://agri.odisha.gov.in",
    tags: ["equipment", "all_crops"],
    state: "odisha",
    active: true,
  },

  // --- BIHAR SCHEMES ---
  {
    name: "Bihar Krishi Input Subsidy",
    description: "Financial assistance for crop loss due to natural calamities like floods, drought, and hailstorm.",
    url: "https://dbtagriculture.bihar.gov.in",
    tags: ["insurance", "wheat", "rice"],
    state: "bihar",
    active: true,
  },
  {
    name: "Bihar Seed Subsidy Scheme",
    description: "Provides high-quality seeds at subsidized rates for Kharif and Rabi seasons to Bihar farmers.",
    url: "https://dbtagriculture.bihar.gov.in",
    tags: ["soil", "rice", "wheat"],
    state: "bihar",
    active: true,
  },
  {
    name: "Bihar Diesel Grant Scheme",
    description: "Subsidy for irrigation costs using diesel pump sets during drought-like conditions.",
    url: "https://dbtagriculture.bihar.gov.in",
    tags: ["irrigation", "rice", "wheat"],
    state: "bihar",
    active: true,
  },

  // --- UP SCHEMES ---
  {
    name: "UP Solar Pump Subsidy",
    description: "Provides up to 60-90% subsidy for installation of surface and deep-well solar pump sets.",
    url: "https://upagriculture.com/solar_pump",
    tags: ["irrigation", "equipment"],
    state: "up",
    active: true,
  },
  {
    name: "UP Krishi Yantra Subsidy",
    description: "Subsidies for small and big agricultural equipment for modernization of farming in UP.",
    url: "https://upagriculture.com",
    tags: ["equipment", "wheat", "mustard"],
    state: "up",
    active: true,
  },
  {
    name: "UP Seed Distribution Scheme",
    description: "Focused on distribution of hybrid seeds for increased yield in wheat and rice clusters.",
    url: "https://upagriculture.com",
    tags: ["soil", "wheat", "rice"],
    state: "up",
    active: true,
  },

  // --- JHARKHAND SCHEMES ---
  {
    name: "Jharkhand Farm Loan Waiver",
    description: "Relief for farmers by waiving agricultural loans up to ₹50,000 for small and marginal landholders.",
    url: "https://agriculture.jharkhand.gov.in",
    tags: ["income", "market"],
    state: "jharkhand",
    active: true,
  },
  {
    name: "Jharkhand Millet Mission",
    description: "Reviving traditional crops and ensuring nutritional security through millet promotion.",
    url: "https://agriculture.jharkhand.gov.in",
    tags: ["maize", "horticulture"],
    state: "jharkhand",
    active: true,
  },

  // --- HORTICULTURE & MULTI-STATE ---
  {
    name: "Mission for Integrated Development of Horticulture (MIDH)",
    description: "Holistic growth of fruit, vegetable, and spice production through new nurseries and post-harvest management.",
    url: "https://midh.gov.in",
    tags: ["horticulture", "soil", "central"],
    state: "all",
    active: true,
  },
  {
    name: "National Mission on Oilseeds and Oil Palm",
    description: "Boosting production of mustard, soyabean, and oil palm to reduce import dependency.",
    url: "https://agriwelfare.gov.in",
    tags: ["mustard", "oilseed", "central"],
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
 * Improved to handle redirects and verify both HEAD and GET if needed.
 */
export async function checkUrlAlive(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    
    // First try a HEAD request (fastest)
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; KrishiSeer-Verifier/1.0; link health check)",
      },
    });
    
    clearTimeout(timeout);
    
    // Success on 200s and 300s
    if (res.ok || (res.status >= 300 && res.status < 400)) return true;
    
    // If HEAD fails (some gov sites block it), try a GET with range header
    if (res.status === 405 || res.status === 403 || res.status === 401 || res.status === 404) {
      const getController = new AbortController();
      const getTimeout = setTimeout(() => getController.abort(), 10000);
      try {
        const getRes = await fetch(url, {
          method: "GET",
          signal: getController.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; KrishiSeer-Verifier/1.0)",
            "Range": "bytes=0-10", // Only fetch first 10 bytes to be polite
          },
        });
        clearTimeout(getTimeout);
        return getRes.ok || getRes.status === 206 || getRes.status === 403; // Some sites return 403 even for GET but are "alive"
      } catch {
        return false;
      }
    }

    return false;
  } catch (err) {
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
