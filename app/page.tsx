"use client";

import { useState } from "react";
import { SensitivityForm } from "@/components/sensitivity-form";
import { SensitivityResultComponent } from "@/components/sensitivity-result";
import { SavedPresets } from "@/components/saved-presets";
import {
  calculateSensitivity,
  generateExplanation,
  type SensitivityResult,
  type Platform,
  type Playstyle,
  type PingLevel,
  type CalculationInput,
} from "@/lib/sensitivity-calculator";
import { Crosshair, Zap, Target, Shield, Sparkles } from "lucide-react";

interface GeneratedResult {
  result: SensitivityResult;
  explanation: string;
  deviceInfo: {
    deviceName: string;
    platform: Platform;
    playstyle: Playstyle;
    pingLevel: PingLevel;
    dpi: number | null;
  };
  input: CalculationInput;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<GeneratedResult | null>(null);
  const [presetRefreshTrigger, setPresetRefreshTrigger] = useState(0);

  const handleGenerate = (data: {
    deviceName: string;
    platform: Platform;
    playstyle: Playstyle;
    pingLevel: PingLevel;
    screenSize: number;
    refreshRate: number;
    dpi: number | null;
    useCustomDpi: boolean;
  }) => {
    setIsLoading(true);

    setTimeout(() => {
      const input: CalculationInput = {
        platform: data.platform,
        playstyle: data.playstyle,
        pingLevel: data.pingLevel,
        screenSize: data.screenSize,
        refreshRate: data.refreshRate,
        dpi: data.dpi,
        useCustomDpi: data.useCustomDpi,
      };

      const result = calculateSensitivity(input);
      const explanation = generateExplanation(input, result);

      setGeneratedResult({
        result,
        explanation,
        deviceInfo: {
          deviceName: data.deviceName,
          platform: data.platform,
          playstyle: data.playstyle,
          pingLevel: data.pingLevel,
          dpi: data.dpi,
        },
        input,
      });

      setIsLoading(false);
    }, 800);
  };

  const handleSavePreset = async (name: string) => {
    if (!generatedResult) return;

    try {
      await fetch("/api/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          device: generatedResult.deviceInfo.deviceName,
          platform: generatedResult.deviceInfo.platform,
          playstyle: generatedResult.deviceInfo.playstyle,
          ping: generatedResult.deviceInfo.pingLevel,
          dpi: generatedResult.deviceInfo.dpi,
          sensitivities: generatedResult.result,
        }),
      });
      setPresetRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to save preset:", error);
    }
  };

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative border-b border-border/40 bg-card/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 rounded-xl bg-primary/10 border border-primary/30 animate-pulse-glow">
              <Crosshair className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                FF Sensitivity Generator
              </h1>
              <p className="text-sm text-muted-foreground">
                Optimize your gameplay
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative border-b border-border/40">
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-6 animate-float">
              <Sparkles className="h-4 w-4" />
              AI-Powered Sensitivity Calculator
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance leading-tight">
              Find Your
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Perfect </span>
              Sensitivity
            </h2>
            
            <p className="text-lg text-muted-foreground mb-10 text-pretty max-w-xl mx-auto">
              Generate optimized Free Fire sensitivity settings tailored to your device, 
              playstyle, and network conditions.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3">
              <div className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card/80 border border-primary/30 hover:border-primary/60 transition-all duration-300 hover:scale-105">
                <Zap className="h-4 w-4 text-primary group-hover:animate-pulse" />
                <span className="text-sm font-medium">AI Detection</span>
              </div>
              <div className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card/80 border border-accent/30 hover:border-accent/60 transition-all duration-300 hover:scale-105">
                <Target className="h-4 w-4 text-accent group-hover:animate-pulse" />
                <span className="text-sm font-medium">6 Playstyles</span>
              </div>
              <div className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card/80 border border-border/50 hover:border-border transition-all duration-300 hover:scale-105">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Ping Optimized</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative container mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left Column - Form */}
          <div className="space-y-6">
            <SensitivityForm onGenerate={handleGenerate} isLoading={isLoading} />
            <SavedPresets refreshTrigger={presetRefreshTrigger} />
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {generatedResult ? (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <SensitivityResultComponent
                  result={generatedResult.result}
                  explanation={generatedResult.explanation}
                  deviceInfo={generatedResult.deviceInfo}
                  onSavePreset={handleSavePreset}
                />
              </div>
            ) : (
              <div className="gaming-card rounded-2xl border border-dashed border-border/50 bg-card/30 backdrop-blur p-12 text-center">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
                  <div className="relative p-4 rounded-full bg-card border border-border/50">
                    <Crosshair className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Ready to Generate
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Enter your device details and select your playstyle to get optimized sensitivity settings.
                </p>
              </div>
            )}

            {/* Info Cards */}
            {!generatedResult && (
              <div className="grid sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                <div className="gaming-card shine-effect rounded-xl border border-border/50 bg-card/60 backdrop-blur p-5 hover:border-primary/30 transition-all duration-300">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    How It Works
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="text-primary">1.</span> Enter your device name
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">2.</span> AI detects specifications
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">3.</span> Select your playstyle
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">4.</span> Get optimized sensitivity
                    </li>
                  </ul>
                </div>
                <div className="gaming-card shine-effect rounded-xl border border-border/50 bg-card/60 backdrop-blur p-5 hover:border-accent/30 transition-all duration-300">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    Sensitivity Range
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="text-accent">-</span> Min: 1 | Max: 200
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-accent">-</span> General is always highest
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-accent">-</span> Scopes decrease progressively
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-accent">-</span> All values are integers
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border/40 bg-card/30 backdrop-blur mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            FF Sensitivity Generator • Not affiliated with Garena •
            Test in Training Ground and adjust as needed
          </p>
        </div>
      </footer>
    </main>
  );
}
