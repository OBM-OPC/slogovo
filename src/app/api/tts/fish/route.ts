import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FISH_TTS_URL = "https://api.fish.audio/v1/tts";
const MAX_TEXT_LENGTH = 300;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.FISH_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Fish Audio API key is not configured" }, { status: 503 });
    }

    const body = await request.json();
    const text = typeof body?.text === "string" ? body.text.trim() : "";

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({ error: "Text is too long" }, { status: 400 });
    }

    const speed = typeof body?.speed === "number" ? Math.min(Math.max(body.speed, 0.5), 2) : 0.9;

    const fishResponse = await fetch(FISH_TTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        model: "s2.1-pro-free",
      },
      body: JSON.stringify({
        text,
        format: "mp3",
        sample_rate: 44100,
        mp3_bitrate: 128,
        normalize: true,
        latency: "normal",
        prosody: {
          speed,
          volume: 0,
          normalize_loudness: true,
        },
      }),
    });

    if (!fishResponse.ok) {
      const errorText = await fishResponse.text().catch(() => "");
      console.error("Fish TTS error:", fishResponse.status, errorText);
      return NextResponse.json({ error: "Fish TTS request failed" }, { status: 502 });
    }

    const audio = await fishResponse.arrayBuffer();

    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Fish TTS route error:", error);
    return NextResponse.json({ error: "TTS generation failed" }, { status: 500 });
  }
}
