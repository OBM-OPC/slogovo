import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readJsonBody, RequestBodyError } from "@/lib/request-security";
import { ipIdentity } from "@/lib/rate-limit";
import { RATE_LIMITS, rateLimitClient, rateLimitRequest } from "@/lib/api-protection";
import { logEvent } from "@/lib/structured-log";
import { z } from "zod";

export const dynamic = "force-dynamic";

const FISH_TTS_URL = "https://api.fish.audio/v1/tts";
const DEFAULT_FISH_VOICE_ID = "2a1036d645634680b3cc69aeeb60375b";
const MAX_TEXT_LENGTH = 300;
const ttsRequestSchema = z.object({
  text: z.string().trim().min(1).max(MAX_TEXT_LENGTH),
  speed: z.number().finite().min(0.75).max(1.1).optional(),
}).strict();

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
    signal: AbortSignal.timeout(10_000),
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const limited = await rateLimitRequest(rateLimitClient(supabase), request, [
      { identity: ipIdentity(request), rule: RATE_LIMITS.ttsIp },
      { identity: `user:${user.id}`, rule: RATE_LIMITS.ttsUser },
    ]);
    if (limited) return limited;

    const apiKey = process.env.FISH_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Fish Audio API key is not configured" }, { status: 503 });
    }

    const parsed = ttsRequestSchema.safeParse(await readJsonBody(request, 8 * 1024));
    if (!parsed.success) {
      return NextResponse.json({ error: "Ungültige TTS-Anfrage" }, { status: 400 });
    }
    const text = parsed.data.text;
    const speed = clamp(parsed.data.speed ?? 0.9, 0.75, 1.1);
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
            "Cache-Control": "private, max-age=86400",
            "X-Fish-Voice-Id": voiceId || "default",
          },
        });
      }

      await fishResponse.body?.cancel().catch(() => undefined);
      lastError = String(fishResponse.status);
      logEvent("audio_failure", {
        errorCode: "TTS_PROVIDER_REJECTED",
        statusCode: fishResponse.status,
        reason: voiceId ? "configured_voice" : "provider_default",
      });
    }

    return NextResponse.json({ error: "TTS-Anfrage fehlgeschlagen", code: lastError }, { status: 502 });
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json(
        { error: "Ungültige TTS-Anfrage", code: error.code },
        { status: error.code === "BODY_TOO_LARGE" ? 413 : 400 }
      );
    }
    logEvent("audio_failure", {
      errorCode: error instanceof Error && error.name === "TimeoutError" ? "TTS_TIMEOUT" : "TTS_FAILED",
      reason: "server",
    });
    return NextResponse.json({ error: "TTS generation failed" }, { status: 500 });
  }
}
