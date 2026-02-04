export type Playstyle = "freestyle" | "instaplayer" | "rusher" | "balanced" | "onetap" | "sniper";
export type PingLevel = "low" | "medium" | "high";
export type Platform = "android" | "ios" | "unknown";

export interface SensitivityResult {
  general: number;
  redDot: number;
  scope2x: number;
  scope4x: number;
  awmScope: number;
  freeLook: number;
}

export interface CalculationInput {
  platform: Platform;
  playstyle: Playstyle;
  pingLevel: PingLevel;
  screenSize: number;
  refreshRate: number;
  dpi: number | null;
  useCustomDpi: boolean;
}

// Clamp value between 1 and 200 (Free Fire limits)
function clamp(value: number): number {
  return Math.min(200, Math.max(1, Math.round(value)));
}

// Base sensitivity values for balanced playstyle, medium ping, standard device
// Tuned to output ~170 general for iPhone 15 Pro Max at balanced
const BASE_SENSITIVITIES = {
  general: 165,
  redDot: 160,
  scope2x: 145,
  scope4x: 130,
  awmScope: 110,
  freeLook: 185
};

// Playstyle modifiers
const PLAYSTYLE_MODIFIERS: Record<Playstyle, Record<string, number>> = {
  freestyle: {
    // Highest sensitivity - for players who love maximum speed and flashy plays
    general: 1.22,
    redDot: 1.20,
    scope2x: 1.15,
    scope4x: 1.10,
    awmScope: 1.05,
    freeLook: 1.08
  },
  instaplayer: {
    // Very high sensitivity - instant reactions, aggressive close combat
    general: 1.18,
    redDot: 1.15,
    scope2x: 1.10,
    scope4x: 1.05,
    awmScope: 1.0,
    freeLook: 1.05
  },
  rusher: {
    // High sensitivity - fast aggressive gameplay
    general: 1.12,
    redDot: 1.08,
    scope2x: 1.05,
    scope4x: 1.02,
    awmScope: 0.98,
    freeLook: 1.03
  },
  balanced: {
    // Standard balanced sensitivity
    general: 1.03,
    redDot: 1.03,
    scope2x: 1.03,
    scope4x: 1.03,
    awmScope: 1.03,
    freeLook: 1.03
  },
  onetap: {
    // Controlled for precise headshots
    general: 1.0,
    redDot: 0.97,
    scope2x: 0.94,
    scope4x: 0.90,
    awmScope: 0.85,
    freeLook: 1.0
  },
  sniper: {
    // Lowest sensitivity - maximum precision for long range
    general: 0.95,
    redDot: 0.92,
    scope2x: 0.88,
    scope4x: 0.82,
    awmScope: 0.75,
    freeLook: 0.95
  }
};

// Ping modifiers - higher ping = slightly higher sens for compensation
const PING_MODIFIERS: Record<PingLevel, number> = {
  low: 0.95,
  medium: 1.0,
  high: 1.08
};

// Screen size modifiers - larger screens need slightly lower sens
function getScreenSizeModifier(screenSize: number): number {
  if (screenSize <= 5.5) return 1.08;
  if (screenSize <= 6.0) return 1.04;
  if (screenSize <= 6.5) return 1.0;
  if (screenSize <= 7.0) return 0.96;
  return 0.92; // Tablets
}

// Refresh rate modifiers - higher refresh = more control = can handle higher sens
function getRefreshRateModifier(refreshRate: number): number {
  if (refreshRate <= 60) return 0.95;
  if (refreshRate <= 90) return 1.0;
  if (refreshRate <= 120) return 1.05;
  return 1.08; // 144Hz+
}

// DPI modifier for Android - higher DPI = lower sens needed
function getDpiModifier(dpi: number): number {
  // Standard DPI is around 400-440
  const standardDpi = 420;
  const ratio = standardDpi / dpi;
  // Scale between 0.85 and 1.15
  return Math.max(0.85, Math.min(1.15, ratio));
}

// iOS optimization - generally more stable touch, slightly lower sens
function getiOSModifier(): number {
  return 0.92;
}

export function calculateSensitivity(input: CalculationInput): SensitivityResult {
  const {
    platform,
    playstyle,
    pingLevel,
    screenSize,
    refreshRate,
    dpi,
    useCustomDpi
  } = input;

  // Get modifiers
  const playstyleModifiers = PLAYSTYLE_MODIFIERS[playstyle];
  const pingModifier = PING_MODIFIERS[pingLevel];
  const screenModifier = getScreenSizeModifier(screenSize);
  const refreshModifier = getRefreshRateModifier(refreshRate);

  // Platform-specific modifier
  let platformModifier = 1.0;
  if (platform === "ios") {
    platformModifier = getiOSModifier();
  } else if (platform === "android" && dpi && (useCustomDpi || dpi > 0)) {
    platformModifier = getDpiModifier(dpi);
  }

  // Calculate each sensitivity
  const result: SensitivityResult = {
    general: clamp(
      BASE_SENSITIVITIES.general *
      playstyleModifiers.general *
      pingModifier *
      screenModifier *
      refreshModifier *
      platformModifier
    ),
    redDot: clamp(
      BASE_SENSITIVITIES.redDot *
      playstyleModifiers.redDot *
      pingModifier *
      screenModifier *
      refreshModifier *
      platformModifier
    ),
    scope2x: clamp(
      BASE_SENSITIVITIES.scope2x *
      playstyleModifiers.scope2x *
      pingModifier *
      screenModifier *
      refreshModifier *
      platformModifier
    ),
    scope4x: clamp(
      BASE_SENSITIVITIES.scope4x *
      playstyleModifiers.scope4x *
      pingModifier *
      screenModifier *
      refreshModifier *
      platformModifier
    ),
    awmScope: clamp(
      BASE_SENSITIVITIES.awmScope *
      playstyleModifiers.awmScope *
      pingModifier *
      screenModifier *
      refreshModifier *
      platformModifier
    ),
    freeLook: clamp(
      BASE_SENSITIVITIES.freeLook *
      playstyleModifiers.freeLook *
      pingModifier *
      screenModifier *
      refreshModifier *
      platformModifier
    )
  };

  // Ensure progressive decrease rule: General > RedDot > 2x > 4x > AWM
  // FreeLook can be independent but should not exceed General
  if (result.redDot >= result.general) result.redDot = result.general - 1;
  if (result.scope2x >= result.redDot) result.scope2x = result.redDot - 1;
  if (result.scope4x >= result.scope2x) result.scope4x = result.scope2x - 1;
  if (result.awmScope >= result.scope4x) result.awmScope = result.scope4x - 1;
  if (result.freeLook > result.general) result.freeLook = result.general;

  // Final clamp after adjustments
  result.general = clamp(result.general);
  result.redDot = clamp(result.redDot);
  result.scope2x = clamp(result.scope2x);
  result.scope4x = clamp(result.scope4x);
  result.awmScope = clamp(result.awmScope);
  result.freeLook = clamp(result.freeLook);

  return result;
}

export function generateExplanation(
  input: CalculationInput,
  result: SensitivityResult
): string {
  const { platform, playstyle, pingLevel, screenSize, refreshRate, dpi } = input;

  let explanation = "";

  // Device explanation
  if (platform === "ios") {
    explanation += `**iOS Optimization:** Your ${screenSize}" iOS device has excellent touch stability. Sensitivities are optimized for smooth, consistent tracking which is ideal for one-taps and drag shots.\n\n`;
  } else if (platform === "android") {
    if (dpi) {
      const dpiLevel = dpi > 480 ? "high" : dpi < 360 ? "low" : "standard";
      explanation += `**Android DPI Adjustment:** Your device runs at ${dpi} DPI (${dpiLevel}). ${
        dpiLevel === "high" 
          ? "Higher DPI means touch input is more sensitive, so we've lowered the in-game sensitivity to compensate."
          : dpiLevel === "low"
          ? "Lower DPI means touch input is less responsive, so we've increased sensitivity slightly."
          : "This is a standard DPI range, providing balanced performance."
      }\n\n`;
    }
  }

  // Screen size explanation
  explanation += `**Screen Size (${screenSize}"):** ${
    screenSize < 6.0 
      ? "Compact screen detected. Slightly higher sensitivity helps with quick movements in limited space."
      : screenSize > 6.8
      ? "Large screen detected. Lower sensitivity provides better precision on bigger displays."
      : "Standard screen size provides balanced control."
  }\n\n`;

  // Refresh rate explanation
  explanation += `**Refresh Rate (${refreshRate}Hz):** ${
    refreshRate >= 120
      ? "High refresh rate allows for more responsive controls. You can handle slightly higher sensitivities with smoother tracking."
      : refreshRate >= 90
      ? "Good refresh rate provides smooth gameplay. Sensitivities are optimized for this range."
      : "Standard 60Hz display. Conservative sensitivities ensure consistent control."
  }\n\n`;

  // Playstyle explanation
  const playstyleDescriptions: Record<Playstyle, string> = {
    freestyle: "**Freestyle Profile:** Maximum sensitivity for flashy plays and extreme speed. Perfect for players who love 360 flicks, fast drag shots, and unpredictable movement. Requires excellent finger control.",
    instaplayer: "**Instaplayer Profile:** Very high sensitivity for instant reactions. Designed for aggressive close-combat dominators who need lightning-fast target acquisition and quick scope-ins.",
    rusher: "**Rusher Profile:** High sensitivity for fast aggressive gameplay. Quick flicks and aggressive pushes will feel natural. Good for players who like to rush and fight up close.",
    balanced: "**Balanced Profile:** Well-rounded sensitivities that work for all situations. Good for players who adapt their playstyle mid-match. Smooth drag shots and consistent one-taps.",
    onetap: "**One-Tap/Headshot Profile:** Controlled sensitivities optimized for precise headshots. Lower scope values help land consistent one-taps. Ideal for ranked and competitive play.",
    sniper: "**Sniper Profile:** Very controlled scope sensitivities, especially for AWM. Designed for patient, accurate long-range gameplay with maximum precision."
  };
  explanation += `${playstyleDescriptions[playstyle]}\n\n`;

  // Ping explanation
  const pingDescriptions: Record<PingLevel, string> = {
    low: "**Low Ping (0-40ms):** Excellent connection! Lower sensitivity compensation applied since your inputs register instantly.",
    medium: "**Medium Ping (41-80ms):** Moderate latency. Sensitivities are at baseline for this range.",
    high: "**High Ping (81+ms):** Higher latency detected. Slightly increased sensitivity helps compensate for delayed input registration."
  };
  explanation += `${pingDescriptions[pingLevel]}\n\n`;

  // Result summary
  explanation += `---\n\n**Your Sensitivity Summary:**\n`;
  explanation += `- General: ${result.general} (highest for overall control)\n`;
  explanation += `- Red Dot: ${result.redDot} (close to mid-range tracking)\n`;
  explanation += `- 2x Scope: ${result.scope2x} (mid-range precision)\n`;
  explanation += `- 4x Scope: ${result.scope4x} (long-range control)\n`;
  explanation += `- AWM Scope: ${result.awmScope} (sniper precision)\n`;
  explanation += `- Free Look: ${result.freeLook} (situational awareness)\n\n`;

  explanation += `**Testing Guide:** Head to the Training Ground and test these settings for 5-10 minutes. If movements feel too fast or slow, adjust each value by ±2 until comfortable.`;

  return explanation;
}
