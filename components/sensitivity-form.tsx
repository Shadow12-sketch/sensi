"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Smartphone, Search, CheckCircle2, AlertCircle, Gamepad2, Sparkles } from "lucide-react";
import type { Playstyle, PingLevel, Platform } from "@/lib/sensitivity-calculator";

interface DeviceSpecs {
  device_name: string;
  platform: Platform;
  screen_size: string;
  refresh_rate: string;
  default_dpi: string;
}

interface FormData {
  deviceName: string;
  platform: Platform;
  playstyle: Playstyle;
  pingLevel: PingLevel;
  screenSize: string;
  refreshRate: string;
  dpi: string;
  useCustomDpi: boolean;
}

interface SensitivityFormProps {
  onGenerate: (data: {
    deviceName: string;
    platform: Platform;
    playstyle: Playstyle;
    pingLevel: PingLevel;
    screenSize: number;
    refreshRate: number;
    dpi: number | null;
    useCustomDpi: boolean;
  }) => void;
  isLoading: boolean;
}

const playstyleInfo: Record<Playstyle, { label: string; desc: string; color: string }> = {
  freestyle: { label: "Freestyle", desc: "Max speed, 360 flicks", color: "text-pink-400" },
  instaplayer: { label: "Instaplayer", desc: "Very high, instant reactions", color: "text-orange-400" },
  rusher: { label: "Rusher", desc: "High, aggressive gameplay", color: "text-red-400" },
  balanced: { label: "Balanced", desc: "All-around versatile", color: "text-primary" },
  onetap: { label: "One-Tap", desc: "Precise headshots", color: "text-blue-400" },
  sniper: { label: "Sniper", desc: "Long range precision", color: "text-cyan-400" },
};

export function SensitivityForm({ onGenerate, isLoading }: SensitivityFormProps) {
  const [formData, setFormData] = useState<FormData>({
    deviceName: "",
    platform: "unknown",
    playstyle: "balanced",
    pingLevel: "medium",
    screenSize: "6.5",
    refreshRate: "60",
    dpi: "440",
    useCustomDpi: false,
  });

  const [deviceSpecs, setDeviceSpecs] = useState<DeviceSpecs | null>(null);
  const [isCheckingDevice, setIsCheckingDevice] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [showDpiQuestion, setShowDpiQuestion] = useState(false);

  const handleDeviceCheck = async () => {
    if (!formData.deviceName.trim()) {
      setDeviceError("Please enter your device name");
      return;
    }

    setIsCheckingDevice(true);
    setDeviceError(null);
    setDeviceSpecs(null);
    setShowDpiQuestion(false);

    try {
      const response = await fetch("/api/device-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceName: formData.deviceName }),
      });

      const data = await response.json();

      if (data.success && data.device) {
        const device = data.device as DeviceSpecs;
        setDeviceSpecs(device);

        const screenSize = device.screen_size !== "unknown" ? device.screen_size : "6.5";
        const refreshRate = device.refresh_rate !== "unknown" 
          ? device.refresh_rate.replace("Hz", "").trim() 
          : "60";
        const dpi = device.default_dpi !== "unknown" && device.default_dpi !== "N/A"
          ? device.default_dpi
          : "440";

        setFormData(prev => ({
          ...prev,
          platform: device.platform,
          screenSize,
          refreshRate,
          dpi,
        }));

        if (device.platform === "android") {
          setShowDpiQuestion(true);
        }

        setShowManualInput(false);
      } else {
        setDeviceError("Could not identify device. Please enter specs manually.");
        setShowManualInput(true);
      }
    } catch {
      setDeviceError("Failed to check device. Please enter specs manually.");
      setShowManualInput(true);
    } finally {
      setIsCheckingDevice(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onGenerate({
      deviceName: formData.deviceName || "Unknown Device",
      platform: formData.platform,
      playstyle: formData.playstyle,
      pingLevel: formData.pingLevel,
      screenSize: parseFloat(formData.screenSize) || 6.5,
      refreshRate: parseInt(formData.refreshRate) || 60,
      dpi: formData.platform === "android" ? parseInt(formData.dpi) || 440 : null,
      useCustomDpi: formData.useCustomDpi,
    });
  };

  return (
    <Card className="gaming-card border-border/50 bg-card/60 backdrop-blur-xl overflow-hidden">
      <CardHeader className="border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          Device & Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Device Name Input */}
          <div className="space-y-2">
            <Label htmlFor="deviceName" className="text-sm font-medium">
              Device Name
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="deviceName"
                  placeholder="e.g., iPhone 15 Pro, Samsung Galaxy S24"
                  value={formData.deviceName}
                  onChange={(e) => setFormData(prev => ({ ...prev, deviceName: e.target.value }))}
                  className="bg-input/50 border-border/50 focus:border-primary/50 pr-10 transition-all duration-300"
                />
                {deviceSpecs && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                )}
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleDeviceCheck}
                disabled={isCheckingDevice}
                className="shrink-0 bg-secondary/80 hover:bg-secondary border-border/50 transition-all duration-300 hover:scale-105"
              >
                {isCheckingDevice ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-2 hidden sm:inline">Detect</span>
              </Button>
            </div>
            {deviceError && (
              <p className="text-sm text-destructive flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
                <AlertCircle className="h-4 w-4" />
                {deviceError}
              </p>
            )}
          </div>

          {/* Device Detected Info */}
          {deviceSpecs && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-500 rounded-xl border border-primary/30 bg-primary/5 p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Device Detected
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm relative">
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs uppercase tracking-wider">Platform</span>
                  <span className="capitalize font-medium block">{deviceSpecs.platform}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs uppercase tracking-wider">Screen</span>
                  <span className="font-medium block">{deviceSpecs.screen_size}"</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs uppercase tracking-wider">Refresh</span>
                  <span className="font-medium block">{deviceSpecs.refresh_rate}Hz</span>
                </div>
                {deviceSpecs.platform === "android" && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">DPI</span>
                    <span className="font-medium block">{deviceSpecs.default_dpi}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DPI Selection for Android Only */}
          {showDpiQuestion && formData.platform === "android" && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-500 space-y-4 rounded-xl border border-accent/30 bg-accent/5 p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">Android DPI Setting (Optional)</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">Android Only</span>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                Change DPI if you use custom display scaling via Developer Options or ADB.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { value: "320", label: "320", desc: "xhdpi", detail: "More content" },
                  { value: "400", label: "400", desc: "~xxhdpi", detail: "Balanced" },
                  { value: "440", label: "440", desc: "xxhdpi", detail: "Default" },
                  { value: "480", label: "480", desc: "xxhdpi+", detail: "Standard" },
                  { value: "520", label: "520", desc: "xxxhdpi", detail: "Larger UI" },
                  { value: "560", label: "560", desc: "xxxhdpi+", detail: "Max Size" },
                ].map((dpiOption) => (
                  <button
                    key={dpiOption.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, dpi: dpiOption.value, useCustomDpi: dpiOption.value !== deviceSpecs?.default_dpi }))}
                    className={`p-2.5 rounded-lg border text-center transition-all duration-300 hover:scale-[1.02] ${
                      formData.dpi === dpiOption.value
                        ? "border-accent/50 bg-accent/20 ring-1 ring-accent/30"
                        : "border-border/50 bg-card/30 hover:border-border"
                    }`}
                  >
                    <span className={`font-bold text-sm ${formData.dpi === dpiOption.value ? "text-accent" : "text-foreground"}`}>
                      {dpiOption.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      {dpiOption.desc}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70 block">
                      {dpiOption.detail}
                    </span>
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs text-muted-foreground">Custom DPI:</span>
                <Input
                  type="number"
                  min="120"
                  max="640"
                  value={formData.dpi}
                  onChange={(e) => setFormData(prev => ({ ...prev, dpi: e.target.value, useCustomDpi: true }))}
                  className="bg-input/50 border-border/50 w-20 h-8 text-sm"
                  placeholder="440"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, dpi: deviceSpecs?.default_dpi || "440", useCustomDpi: false }))}
                  className="text-xs h-8 text-muted-foreground hover:text-foreground"
                >
                  Reset to default
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground bg-card/50 rounded-lg p-2.5 space-y-1">
                <p><strong>Device default:</strong> {deviceSpecs?.default_dpi || "440"} DPI</p>
                <p><strong>Tip:</strong> Lower DPI = smaller UI elements, more screen space. Higher DPI = larger UI, better readability.</p>
              </div>
            </div>
          )}

          {/* Manual Input Section */}
          {showManualInput && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-500 space-y-4 rounded-xl border border-border/50 bg-card/50 p-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Enter Device Specs Manually
              </h4>
              
              <div className="space-y-2">
                <Label htmlFor="platform" className="text-sm">Platform</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value: Platform) => setFormData(prev => ({ ...prev, platform: value }))}
                >
                  <SelectTrigger id="platform" className="bg-input/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="android">Android</SelectItem>
                    <SelectItem value="ios">iOS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="screenSize" className="text-sm">Screen Size (inches)</Label>
                  <Input
                    id="screenSize"
                    type="number"
                    step="0.1"
                    min="4"
                    max="13"
                    value={formData.screenSize}
                    onChange={(e) => setFormData(prev => ({ ...prev, screenSize: e.target.value }))}
                    className="bg-input/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refreshRate" className="text-sm">Refresh Rate</Label>
                  <Select
                    value={formData.refreshRate}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, refreshRate: value }))}
                  >
                    <SelectTrigger id="refreshRate" className="bg-input/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">60 Hz</SelectItem>
                      <SelectItem value="90">90 Hz</SelectItem>
                      <SelectItem value="120">120 Hz</SelectItem>
                      <SelectItem value="144">144 Hz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.platform === "android" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">DPI (Optional)</Label>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent">Android Only</span>
                  </div>
                  <p className="text-xs text-muted-foreground -mt-1">
                    Only change if you use custom DPI. Most users should keep default.
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { value: "320", label: "320", desc: "xhdpi" },
                      { value: "400", label: "400", desc: "xxhdpi" },
                      { value: "440", label: "440", desc: "Default" },
                      { value: "480", label: "480", desc: "xxhdpi+" },
                      { value: "520", label: "520", desc: "xxxhdpi" },
                      { value: "560", label: "560", desc: "xxxhdpi+" },
                    ].map((dpiOption) => (
                      <button
                        key={dpiOption.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, dpi: dpiOption.value }))}
                        className={`p-2 rounded-lg border text-center transition-all duration-300 hover:scale-[1.02] ${
                          formData.dpi === dpiOption.value
                            ? "border-primary/50 bg-primary/20 ring-1 ring-primary/30"
                            : "border-border/50 bg-card/30 hover:border-border"
                        }`}
                      >
                        <span className={`font-bold text-sm ${formData.dpi === dpiOption.value ? "text-primary" : "text-foreground"}`}>
                          {dpiOption.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {dpiOption.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Custom:</span>
                    <Input
                      type="number"
                      min="120"
                      max="640"
                      value={formData.dpi}
                      onChange={(e) => setFormData(prev => ({ ...prev, dpi: e.target.value }))}
                      className="bg-input/50 border-border/50 w-20 h-8 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Playstyle Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-primary" />
              Playstyle
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.entries(playstyleInfo) as [Playstyle, typeof playstyleInfo.balanced][]).map(([key, info]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, playstyle: key }))}
                  className={`p-3 rounded-xl border text-left transition-all duration-300 hover:scale-[1.02] ${
                    formData.playstyle === key
                      ? "border-primary/50 bg-primary/10 ring-1 ring-primary/30"
                      : "border-border/50 bg-card/30 hover:border-border"
                  }`}
                >
                  <span className={`font-semibold text-sm ${formData.playstyle === key ? info.color : "text-foreground"}`}>
                    {info.label}
                  </span>
                  <span className="text-xs text-muted-foreground block mt-0.5">
                    {info.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Ping Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Average Ping</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "low", label: "Low", desc: "0-40 ms", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
                { value: "medium", label: "Medium", desc: "41-80 ms", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
                { value: "high", label: "High", desc: "81+ ms", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
              ].map((ping) => (
                <button
                  key={ping.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, pingLevel: ping.value as PingLevel }))}
                  className={`p-3 rounded-xl border text-center transition-all duration-300 hover:scale-[1.02] ${
                    formData.pingLevel === ping.value
                      ? `${ping.border} ${ping.bg} ring-1 ring-current/30`
                      : "border-border/50 bg-card/30 hover:border-border"
                  }`}
                >
                  <span className={`font-semibold text-sm ${formData.pingLevel === ping.value ? ping.color : "text-foreground"}`}>
                    {ping.label}
                  </span>
                  <span className="text-xs text-muted-foreground block mt-0.5">
                    {ping.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-primary/40 disabled:opacity-50 disabled:hover:scale-100"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Sensitivity
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
