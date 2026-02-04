import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

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

interface PresetsData {
  presets: Preset[];
}

const presetsFilePath = path.join(process.cwd(), "data", "presets.json");

async function getPresets(): Promise<PresetsData> {
  try {
    const data = await fs.readFile(presetsFilePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return { presets: [] };
  }
}

async function savePresets(data: PresetsData): Promise<void> {
  await fs.mkdir(path.dirname(presetsFilePath), { recursive: true });
  await fs.writeFile(presetsFilePath, JSON.stringify(data, null, 2));
}

export async function GET() {
  try {
    const data = await getPresets();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to get presets:", error);
    return NextResponse.json({ presets: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const preset: Omit<Preset, "id" | "createdAt"> = await request.json();
    
    const data = await getPresets();
    
    const newPreset: Preset = {
      ...preset,
      id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };
    
    data.presets.push(newPreset);
    await savePresets(data);
    
    return NextResponse.json({ success: true, preset: newPreset });
  } catch (error) {
    console.error("Failed to save preset:", error);
    return NextResponse.json(
      { error: "Failed to save preset" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "Preset ID is required" },
        { status: 400 }
      );
    }
    
    const data = await getPresets();
    data.presets = data.presets.filter(p => p.id !== id);
    await savePresets(data);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete preset:", error);
    return NextResponse.json(
      { error: "Failed to delete preset" },
      { status: 500 }
    );
  }
}
