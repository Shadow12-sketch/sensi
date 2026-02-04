"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, FolderOpen, Clock, ChevronDown, ChevronUp, Bookmark } from "lucide-react";

interface Preset {
  id: string;
  name: string;
  device: string;
  platform: string;
  playstyle: string;
  ping: string;
  dpi: number | null;
  sensitivities: {
    general: number;
    redDot: number;
    scope2x: number;
    scope4x: number;
    awmScope: number;
    freeLook: number;
  };
  createdAt: string;
}

interface SavedPresetsProps {
  refreshTrigger: number;
}

const sensitivityLabels = [
  { key: "general", label: "GEN" },
  { key: "redDot", label: "RD" },
  { key: "scope2x", label: "2x" },
  { key: "scope4x", label: "4x" },
  { key: "awmScope", label: "AWM" },
  { key: "freeLook", label: "FL" },
];

export function SavedPresets({ refreshTrigger }: SavedPresetsProps) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchPresets = async () => {
    try {
      const response = await fetch("/api/presets");
      const data = await response.json();
      setPresets(data.presets || []);
    } catch (error) {
      console.error("Failed to fetch presets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPresets();
  }, [refreshTrigger]);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/presets?id=${id}`, { method: "DELETE" });
      setPresets((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Failed to delete preset:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <Card className="gaming-card border-border/50 bg-card/60 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (presets.length === 0) {
    return (
      <Card className="gaming-card border-border/50 bg-card/60 backdrop-blur-xl">
        <CardHeader className="border-b border-border/30">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 rounded-lg bg-muted/50 border border-border/30">
              <Bookmark className="h-4 w-4 text-muted-foreground" />
            </div>
            Saved Presets
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground py-4 text-sm">
            No saved presets yet. Generate a sensitivity and save it!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gaming-card border-border/50 bg-card/60 backdrop-blur-xl">
      <CardHeader className="border-b border-border/30">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
            <FolderOpen className="h-4 w-4 text-primary" />
          </div>
          Saved Presets
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {presets.length} saved
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        {presets.map((preset, index) => (
          <div
            key={preset.id}
            className="rounded-xl border border-border/30 bg-card/50 overflow-hidden transition-all duration-300 hover:border-border/60 animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <button
              type="button"
              onClick={() => setExpandedId(expandedId === preset.id ? null : preset.id)}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/20 transition-colors duration-200"
            >
              <div className="flex items-center gap-3 text-left min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">
                    {preset.sensitivities.general}
                  </span>
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-foreground text-sm truncate">{preset.name}</h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {preset.device} • {preset.playstyle}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(preset.createdAt)}
                </span>
                <div className="p-1 rounded-md hover:bg-muted/30 transition-colors">
                  {expandedId === preset.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </button>

            {expandedId === preset.id && (
              <div className="border-t border-border/30 p-4 bg-muted/10 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="grid grid-cols-6 gap-2 mb-4">
                  {sensitivityLabels.map((item) => (
                    <div key={item.key} className="text-center p-2 rounded-lg bg-card/50 border border-border/20">
                      <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">{item.label}</span>
                      <span className="font-bold text-lg tabular-nums">
                        {preset.sensitivities[item.key as keyof typeof preset.sensitivities]}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                    <span className="px-2 py-1 rounded-md bg-card/50 border border-border/20">
                      {preset.platform.toUpperCase()}
                    </span>
                    <span className="px-2 py-1 rounded-md bg-card/50 border border-border/20 capitalize">
                      {preset.ping} ping
                    </span>
                    {preset.dpi && (
                      <span className="px-2 py-1 rounded-md bg-card/50 border border-border/20">
                        {preset.dpi} DPI
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(preset.id);
                    }}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
