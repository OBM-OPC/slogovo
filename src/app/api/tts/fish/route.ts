import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FISH_TTS_URL = "https://api.fish.audio/v1/tts";
const DEFAULT_FISH_VOICE_ID = "2a1036d645634680b3cc69aeeb60375b";
const MAX_TEXT_LENGTH = 300;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function sanitizeVoiceId(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return /^[a-f0-9]{32}$/i.test(trimmed) ? trimmed : null;
}

function buildFishPayload(text: string, speed: number, voiceId: string | null) {
  return {
    text,
    ...(voiceId ? { reference_id: voiceId } : {}),
    // Lower sampling variance keeps short vocabulary audio more stable.
    temperature: 0.55,
    top_p: 0.65,
    repetition_penalty: 1.15,
    // Short words should not inherit prosody from previous chunks.
    condition_on_previous_chunks: false,
    chunk_length: 120,
    min_chunk_length: 20,
    early_stop_threshold: 1,
    max_new_tokens: 512,
    normalize: true,
    format: "mp3",
    sample_rate: 44100,
    mp3_bitrate: 192,
    latency: "normal",
    prosody: {
      speed,
      volume: 0,
      normalize_loudness: true,
    },
  };
}

async function requestFishAudio(apiKey: string, text: string, speed: number, voiceId: string | null) {
  return fetch(FISH_TTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      model: "s2.1-pro-free",
    },
    body: JSON.stringify(buildFishPayload(text, speed, voiceId)),
  });
}

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

    const speed = typeof body?.speed === "number" ? clamp(body.speed, 0.75, 1.1) : 0.9;
    const configuredVoiceId = sanitizeVoiceId(process.env.FISH_VOICE_ID);
    const defaultVoiceId = sanitizeVoiceId(DEFAULT_FISH_VOICE_ID);
    const voiceAttempts = [configuredVoiceId, defaultVoiceId, null].filter(
      (voiceId, index, all) => all.indexOf(voiceId) === index
    );

    let lastError = "";

    for (const voiceId of voiceAttempts) {
      const fishResponse = await requestFishAudio(apiKey, text, speed, voiceId);

      if (fishResponse.ok) {
        const audio = await fishResponse.arrayBuffer();
        return new NextResponse(audio, {
          status: 200,
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, max-age=31536000, immutable",
            "X-Fish-Voice-Id": voiceId || "default",
          },
        });
      }

      const errorText = await fishResponse.text().catch(() => "");
      lastError = `${fishResponse.status} ${errorText}`.trim();
      console.error("Fish TTS error:", { voiceId: voiceId || "default", status: fishResponse.status, errorText });
    }

    return NextResponse.json({ error: "Fish TTS request failed", details: lastError }, { status: 502 });
  } catch (error) {
    console.error("Fish TTS route error:", error);
    return NextResponse.json({ error: "TTS generation failed" }, { status: 500 });
  }
}
