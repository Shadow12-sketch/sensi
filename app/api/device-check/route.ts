import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const OPENROUTER_API_KEY =
  "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";

interface DeviceSpecs {
  device_name: string;
  platform: "android" | "ios" | "unknown";
  screen_size: string;
  refresh_rate: string;
  default_dpi: string;
}

interface DevicesCache {
  [key: string]: DeviceSpecs;
}

const devicesFilePath = path.join(process.cwd(), "data", "devices.json");

async function getDevicesCache(): Promise<DevicesCache> {
  try {
    const data = await fs.readFile(devicesFilePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveDeviceToCache(device: DeviceSpecs): Promise<void> {
  try {
    const cache = await getDevicesCache();
    const key = device.device_name.toLowerCase().trim();
    cache[key] = device;

    await fs.mkdir(path.dirname(devicesFilePath), { recursive: true });
    await fs.writeFile(devicesFilePath, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error("Failed to save device to cache:", error);
  }
}

// Fuzzy matching to find similar device names
function findSimilarDevice(
  deviceName: string,
  cache: DevicesCache
): DeviceSpecs | null {
  const normalizedInput = deviceName.toLowerCase().trim();
  const cacheKeys = Object.keys(cache);

  // Exact match
  if (cache[normalizedInput]) {
    return cache[normalizedInput];
  }

  // Check if input contains any cache key or vice versa
  for (const key of cacheKeys) {
    if (normalizedInput.includes(key) || key.includes(normalizedInput)) {
      return cache[key];
    }
  }

  // Check for partial matches (at least 60% of words match)
  const inputWords = normalizedInput.split(/\s+/);
  for (const key of cacheKeys) {
    const keyWords = key.split(/\s+/);
    let matchCount = 0;
    for (const word of inputWords) {
      if (keyWords.some((kw) => kw.includes(word) || word.includes(kw))) {
        matchCount++;
      }
    }
    if (matchCount >= Math.ceil(inputWords.length * 0.6)) {
      return cache[key];
    }
  }

  // Brand-based estimation
  const brandDefaults: Record<string, Partial<DeviceSpecs>> = {
    iphone: { platform: "ios", refresh_rate: "60", default_dpi: "N/A" },
    ipad: { platform: "ios", refresh_rate: "60", default_dpi: "N/A" },
    samsung: { platform: "android", refresh_rate: "120", default_dpi: "420" },
    galaxy: { platform: "android", refresh_rate: "120", default_dpi: "420" },
    oneplus: { platform: "android", refresh_rate: "120", default_dpi: "480" },
    redmi: { platform: "android", refresh_rate: "120", default_dpi: "440" },
    poco: { platform: "android", refresh_rate: "120", default_dpi: "440" },
    realme: { platform: "android", refresh_rate: "120", default_dpi: "440" },
    vivo: { platform: "android", refresh_rate: "120", default_dpi: "440" },
    oppo: { platform: "android", refresh_rate: "120", default_dpi: "440" },
    xiaomi: { platform: "android", refresh_rate: "120", default_dpi: "460" },
    pixel: { platform: "android", refresh_rate: "90", default_dpi: "420" },
    google: { platform: "android", refresh_rate: "90", default_dpi: "420" },
    nothing: { platform: "android", refresh_rate: "120", default_dpi: "420" },
    motorola: { platform: "android", refresh_rate: "120", default_dpi: "420" },
    infinix: { platform: "android", refresh_rate: "90", default_dpi: "400" },
    tecno: { platform: "android", refresh_rate: "90", default_dpi: "400" },
    asus: { platform: "android", refresh_rate: "120", default_dpi: "440" },
    rog: { platform: "android", refresh_rate: "165", default_dpi: "480" },
    iqoo: { platform: "android", refresh_rate: "120", default_dpi: "450" },
    huawei: { platform: "android", refresh_rate: "90", default_dpi: "420" },
    honor: { platform: "android", refresh_rate: "90", default_dpi: "420" },
  };

  for (const [brand, defaults] of Object.entries(brandDefaults)) {
    if (normalizedInput.includes(brand)) {
      return {
        device_name: deviceName,
        platform: defaults.platform as "android" | "ios",
        screen_size: "6.5",
        refresh_rate: defaults.refresh_rate || "60",
        default_dpi: defaults.default_dpi || "420",
      };
    }
  }

  return null;
}

async function queryOpenRouter(deviceName: string): Promise<DeviceSpecs | null> {
  try {
    // Try multiple free models in order
    const freeModels = [
      "nousresearch/hermes-3-llama-3.1-405b:free",
      "meta-llama/llama-3.2-3b-instruct:free",
      "google/gemma-2-9b-it:free",
      "mistralai/mistral-7b-instruct:free",
    ];

    for (const model of freeModels) {
      try {
        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://freefire-sens-generator.vercel.app",
              "X-Title": "Free Fire Sensitivity Generator",
            },
            body: JSON.stringify({
              model: model,
              messages: [
                {
                  role: "system",
                  content: `You are a mobile device specification expert. When given a device name, return ONLY a JSON object with these exact fields:
- device_name: the full device name
- platform: "android" or "ios" (lowercase only)
- screen_size: screen size in inches (e.g., "6.7")
- refresh_rate: refresh rate in Hz (e.g., "120")
- default_dpi: default DPI value for Android devices (e.g., "440"), use "N/A" for iOS

If you're unsure about any value, make a reasonable estimate based on similar devices.
Return ONLY valid JSON, no markdown, no explanation.`,
                },
                {
                  role: "user",
                  content: `Get specifications for this mobile device: ${deviceName}`,
                },
              ],
              temperature: 0.1,
              max_tokens: 200,
            }),
          }
        );

        if (!response.ok) {
          console.error(`[v0] Model ${model} failed with status:`, response.status);
          continue; // Try next model
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) continue;

        // Parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) continue;

        const specs = JSON.parse(jsonMatch[0]) as DeviceSpecs;
        console.log(`[v0] Successfully got specs from ${model}:`, specs);
        return specs;
      } catch (modelError) {
        console.error(`[v0] Model ${model} error:`, modelError);
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error("[v0] OpenRouter query failed:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceName } = body;

    if (!deviceName || typeof deviceName !== "string") {
      return NextResponse.json(
        { error: "Device name is required" },
        { status: 400 }
      );
    }

    const normalizedName = deviceName.toLowerCase().trim();

    // Check cache first with fuzzy matching
    const cache = await getDevicesCache();

    // Try exact match first
    if (cache[normalizedName]) {
      console.log("[v0] Found exact match in cache");
      return NextResponse.json({
        success: true,
        source: "cache",
        device: cache[normalizedName],
      });
    }

    // Try fuzzy match
    const fuzzyMatch = findSimilarDevice(deviceName, cache);
    if (fuzzyMatch) {
      console.log("[v0] Found fuzzy match in cache:", fuzzyMatch.device_name);
      return NextResponse.json({
        success: true,
        source: "cache_fuzzy",
        device: {
          ...fuzzyMatch,
          device_name: deviceName, // Use the user's input as device name
        },
      });
    }

    // Query OpenRouter AI as last resort
    console.log("[v0] No cache match, trying OpenRouter API...");
    const specs = await queryOpenRouter(deviceName);

    if (specs) {
      // Save to cache for future use
      await saveDeviceToCache(specs);

      return NextResponse.json({
        success: true,
        source: "ai",
        device: specs,
      });
    }

    // All methods failed - return with instructions to enter manually
    console.log("[v0] All detection methods failed");
    return NextResponse.json({
      success: false,
      error: "Could not identify device. Please enter specs manually.",
      device: {
        device_name: deviceName,
        platform: "unknown",
        screen_size: "unknown",
        refresh_rate: "unknown",
        default_dpi: "unknown",
      },
    });
  } catch (error) {
    console.error("[v0] Device check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
